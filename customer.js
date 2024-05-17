const express = require("express");
const bodyParser = require("body-parser");
const mysql = require("mysql2/promise");
const app = express();
const pool = mysql.createPool({
  host: "127.0.0.1",
  user: "root",
  password: "#Arulkumara1010",
  database: "art",
});

app.use(express.static(__dirname));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/home.html");
});

async function generateId(username, password) {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM art.person, art.customer, art.phonenumber WHERE username = ? AND password = ?",
      [username, password]
    );
    if (rows.length > 0) {
      return -1;
    }

    const [countRows] = await pool.query(
      "SELECT COUNT(*) as count FROM art.person, art.customer, art.phonenumber"
    );
    const count = countRows[0].count;
    const id = "C" + ("000" + (count + 1)).slice(-3);
    return id;
  } catch (error) {
    console.error("Error in generateId:", error);
    throw error; // Throw the error to be caught in the caller function
  }
}

app.get("/cust-details", (req, res) => {
    res.sendFile(__dirname + "/Customerdetails.html");
});

app.post("/cust", async (req, res) => {
  const { username, password } = req.body;
  try {
    const id = await generateId(username, password); // Await the generateId function
    if (id != -1) {
      await pool.query(
        "INSERT into art.person (id, name, dob, address, email) VALUES (?, null, null, null, null)",
        [id]
      );
      await pool.query(
        "INSERT into art.customer (customerID, username, password) VALUES (?, ?, ?)",
        [id, username, password]
      );
      await pool.query(
        "INSERT into art.phonenumber (id, phone) VALUES (?, null)",
        [id]
      );
      res.redirect("/cust-details");
    } else {
      res.status(400).send("Customer already exists!");
    }
  } catch (error) {
    console.error("Error in POST /cust:", error);
    res.status(500).send("An error occurred while processing your request.");
  }
});

app.listen(8888, () => {
  console.log("Server is running on port 8888");
  console.log("Server link: http://localhost:8888/");
});
