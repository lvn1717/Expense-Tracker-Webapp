const express = require('express');
const cors = require('cors');
const mysql = require('mysql');

const app = express();
const port = port;//port number

// Middleware
app.use(cors());
app.use(express.json());

// MySQL connection setup
const db = mysql.createConnection({
  host: 'localhost',
  user: '',// your MYSQL user
  password: '', // Your MySQL password
  database: 'expense_tracker' // Your database name
});

// Connect to MySQL
db.connect(err => {
  if (err) {
    console.error('Database connection failed: ' + err.stack);
    return;
  }
  console.log('Connected to MySQL database.');
});

// API Routes
app.get('/transactions', (req, res) => {
  const sql = 'SELECT * FROM transactions';
  db.query(sql, (err, results) => {
    if (err) throw err;
    res.json(results);
  });
});

app.post('/transactions', (req, res) => {
  const { description, amount, date, type } = req.body;
  const sql = 'INSERT INTO transactions (description, amount, date, type) VALUES (?, ?, ?, ?)';
  db.query(sql, [description, amount, date, type], (err, result) => {
    if (err) throw err;
    res.status(201).json({ id: result.insertId, ...req.body });
  });
});

app.delete('/transactions/:id', (req, res) => {
  const { id } = req.params;
  const sql = 'DELETE FROM transactions WHERE id = ?';
  db.query(sql, [id], (err, result) => {
    if (err) throw err;
    res.json({ message: 'Transaction deleted' });
  });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
