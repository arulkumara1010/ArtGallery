const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
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
})

app.use(express.json())
app.use(express.urlencoded({extended: true}))

app.post('/form', (req, res) => {
    const { name, email, phone, dob, address } = req.body;

    try {
        pool.query('INSERT INTO art.artists (name, email, phone, dob, address) VALUES (?, ?, ?, ?, ?)', [name, email, phone, dob, address]);
    } catch (error) {
        console.error('Error:', error);
    }
})
app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
