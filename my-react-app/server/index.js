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
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10
});

mongoose.connect(process.env.MONGO_URI);

const auditSchema = new mongoose.Schema({
    transaction_id: { type: String, required: true, unique: true },
    event_type: String,
    actor: {
        ip: String,
        agent: String
    },
    created_at: { type: Date, default: Date.now }
});

const AuditLog = mongoose.model('AuditLog', auditSchema, 'transaction_metadata');

app.post('/api/transaction', async (req, res) => {
    const { amount, userId, metadata } = req.body;
    const txnId = crypto.randomUUID();

    try {
        await mysqlPool.execute(
            "INSERT INTO transactions (transaction_id, user_id, amount, status, idempotency_key) VALUES (UUID_TO_BIN(?), UUID_TO_BIN(?), ?, 'completed', ?)",
            [txnId, userId, amount, txnId]
        );

        const newLog = await AuditLog.create({
            transaction_id: txnId,
            event_type: 'transaction_created',
            actor: {
                ip: metadata.ip,
                agent: metadata.device
            }
        });

        await mysqlPool.execute(
            "UPDATE transactions SET mongodb_audit_id = ? WHERE transaction_id = UUID_TO_BIN(?)",
            [newLog._id.toString(), txnId]
        );

        res.status(200).json({ 
            success: true, 
            transaction_id: txnId,
            mongo_id: newLog._id 
        });

    } catch (err) {
        console.error("Logic Error:", err.message);
        res.status(500).json({ error: "Transaction Failed: Integrity Constraint Violated" });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`LogSync Backend active on port ${PORT}`));