const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2/promise'); 
const app = express();
const pool = mysql.createPool({
  host: "127.0.0.1",
  user: "root",
  password: "#Arulkumara1010",
  database: 'art'
});

app.use(bodyParser.urlencoded({ extended: true }));

app.get('/form', (req, res) => {
    res.sendFile(__dirname + '/dash.html');
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

async function generateId(name, email, phone, dob, address, style) {
    try {
        const [rows, fields] = await pool.query('SELECT id FROM art.person WHERE name = ? AND email = ? AND dob = ? AND address = ?', [name, email, dob, address]);
        
        if (rows.length > 0) {
            return -1;
        }
        
        const [countRows] = await pool.query('SELECT COUNT(*) as count FROM art.person');
        const count = countRows[0].count;
        const id = 'A' + ('000' + (count + 1)).slice(-3);
        return id;
    } catch (error) {
        throw error; 
    }
}

app.post('/form', async (req, res) => {
    const { name, email, phone, dob, address, style } = req.body;

    try {
        const id = await generateId(name, email, phone, dob, address, style); 
        
        if (id != -1) {
            await pool.query('INSERT into art.person (id, name, dob, address, email) VALUES (?, ?, ?, ?, ?)', [id, name, dob, address, email]);
            await pool.query('INSERT into art.artist (artistId, style) VALUES (?, ?)', [id, style]);
            await pool.query('INSERT into art.phonenumber (id, phone) VALUES (?, ?)', [id, phone]);
        }
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('An error occurred while processing your request.');
    }
});

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});