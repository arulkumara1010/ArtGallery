const mysql = require('mysql2');

const pool = mysql.createPool({
  host: "127.0.0.1",
  user: "root",
  password: "#Arulkumara1010",
  database: 'art'
});

pool.query("select * from art.gallery", function(err, rows, fields) {
  if (err) throw err;
  console.log(rows);
});

