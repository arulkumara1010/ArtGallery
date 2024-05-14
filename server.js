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
        const [rows, fields] = await pool.query('SELECT art.person.id FROM art.artist INNER JOIN art.person ON art.artist.artistId = art.person.id INNER JOIN art.phonenumber ON art.phonenumber.id = art.person.id WHERE name = ? AND email = ? AND dob = ? AND address = ?', [name, email, dob, address]);
        
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
app.get('/data', async (req, res) => {
    try {
        const [rows, fields] = await pool.query('SELECT * FROM art.artist INNER JOIN art.person ON art.artist.artistId = art.person.id INNER JOIN art.phonenumber ON art.phonenumber.id = art.person.id');
        res.send(rows); // Send the fetched artist data as JSON response
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('An error occurred while processing your request.');
    }
});

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

app.get('/data', async (req, res) => {
    try {
        const [rows, fields] = await pool.query('SELECT * FROM art.artist INNER JOIN art.person ON art.artist.artistId = art.person.id inner join art.phonenumber on art.person.id = art.phonenumber.id');
        res.render('data', { artists: rows });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('An error occurred while processing your request.');
    }
});

app.delete('/artist/:id', async (req, res) => {
    const artistId = req.params.id;

    try {
        const [existingRows] = await pool.query('SELECT * FROM art.person WHERE id = ?', [artistId]);
        
        if (existingRows.length === 0) {
            return res.status(404).send('Artist not found');
        }
        await pool.query('DELETE FROM art.phonenumber WHERE id = ?', [artistId]);
        await pool.query('DELETE FROM art.artist WHERE artistId = ?', [artistId]);
        await pool.query('DELETE FROM art.person WHERE id = ?', [artistId]);

        res.status(200).send('Artist deleted successfully');
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('An error occurred while processing your request.');
    }
});



app.listen(3000, () => {
    console.log('Server is running on port 3000');
});
