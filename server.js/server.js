// server.js - Render 後端發票伺服器
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// 連接 Render PostgreSQL 資料庫
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

// 初始化資料表
const initDb = async () => {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS invoices (
            id BIGINT PRIMARY KEY,
            order_id TEXT,
            apply_date TEXT,
            pay_method TEXT,
            month_key TEXT,
            week_key TEXT,
            picker TEXT,
            inv_type TEXT,
            carrier_type TEXT,
            carrier_no TEXT,
            cust_name TEXT,
            cust_email TEXT,
            cust_phone TEXT,
            address TEXT,
            zip TEXT,
            tax_type TEXT,
            memo TEXT,
            products JSONB,
            grand_total INT,
            status TEXT,
            inv_no TEXT,
            is_archived BOOLEAN DEFAULT false
        );
    `);
};
initDb();

// API 1: 取得所有發票紀錄
app.get('/api/invoices', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM invoices ORDER BY id DESC');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// API 2: 新增或更新發票
app.post('/api/invoices', async (req, res) => {
    const i = req.body;
    try {
        await pool.query(`
            INSERT INTO invoices (id, order_id, apply_date, pay_method, month_key, week_key, picker, inv_type, carrier_type, carrier_no, cust_name, cust_email, cust_phone, address, zip, tax_type, memo, products, grand_total, status, inv_no, is_archived)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
            ON CONFLICT (id) DO UPDATE SET
                status = EXCLUDED.status, inv_no = EXCLUDED.inv_no, is_archived = EXCLUDED.is_archived,
                order_id = EXCLUDED.order_id, apply_date = EXCLUDED.apply_date, pay_method = EXCLUDED.pay_method,
                picker = EXCLUDED.picker, inv_type = EXCLUDED.inv_type, carrier_type = EXCLUDED.carrier_type,
                carrier_no = EXCLUDED.carrier_no, cust_name = EXCLUDED.cust_name, cust_email = EXCLUDED.cust_email,
                cust_phone = EXCLUDED.cust_phone, address = EXCLUDED.address, zip = EXCLUDED.zip,
                tax_type = EXCLUDED.tax_type, memo = EXCLUDED.memo, products = EXCLUDED.products, grand_total = EXCLUDED.grand_total;
        `, [i.id, i.orderId, i.applyDate, i.payMethod, i.monthKey, i.weekKey, i.picker, i.invType, i.carrierType, i.carrierNo, i.custName, i.custEmail, i.custPhone, i.address, i.zip, i.taxType, i.memo, JSON.stringify(i.products), i.grandTotal, i.status, i.invNo, i.isArchived]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// API 3: 刪除發票
app.delete('/api/invoices/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM invoices WHERE id = $1', [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));