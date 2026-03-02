require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const mongoose = require('mongoose');
const cors = require('cors');
const crypto = require('crypto');

const app = express();
app.use(cors());
app.use(express.json());

const mysqlPool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

mongoose.connect(process.env.MONGO_URI);

const AuditLog = mongoose.model('AuditLog', new mongoose.Schema({
    transaction_id: { type: String, required: true, unique: true },
    event_type: String,
    actor: Object,
    created_at: { type: Date, default: Date.now }
}), 'transaction_metadata');

app.post('/api/transaction', async (req, res) => {
    const { amount, userId, metadata } = req.body;
    const txnId = crypto.randomUUID();

    try {
        const newLog = await AuditLog.create({
            transaction_id: txnId,
            event_type: 'transaction_created',
            actor: metadata
        });

        await mysqlPool.execute(
            "INSERT INTO transactions (transaction_id, mongodb_audit_id, user_id, amount, status, idempotency_key) VALUES (UUID_TO_BIN(?), ?, UUID_TO_BIN(?), ?, 'completed', ?)",
            [txnId, newLog._id.toString(), userId, amount, txnId]
        );

        res.status(200).json({ success: true, txnId, mongoId: newLog._id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(process.env.PORT || 5000);