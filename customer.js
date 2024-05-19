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

var customerID = "";

app.use(express.static(__dirname));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/home.html");
});

app.get("/base", (req, res) => {
  res.sendFile(__dirname + "/base.html");
});

async function generateId(username, password) {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM art.person inner join art.customer on art.person.id = art.customer.customerID inner join art.phonenumber on art.person.id = art.phonenumber.id WHERE username = ? AND password = ?",
      [username, password]
    );
    if (rows.length > 0) {
      return -1;
    }

    const [countRows] = await pool.query(
      "SELECT COUNT(*) as count FROM art.customer"
    );
    const count = countRows[0].count;
    const id = "C" + ("000" + (count + 1)).slice(-3);
    return id;
  } catch (error) {
    console.error("Error in generateId:", error);
    throw error;
  }
}

async function gen_tid(paintingID) {
  try {
    const [countRows] = await pool.query(
      "SELECT COUNT(*) as count FROM art.purchases where paintingID = ?",
      [paintingID]
    );
    const count = countRows[0].count;
    const id = "T" + ("000" + (count + 1)).slice(-3);
    return id;
  } catch (error) {
    console.error("Error in gen_tid:", error);
    throw error;
  }
}
app.get("/cust-details", (req, res) => {
  res.sendFile(__dirname + "/Customerdetails.html");
});

app.post("/cus", async (req, res) => {
  const { name, email, phone, dob, address } = req.body;
  try {
    const [idRows] = await pool.query(
      "SELECT id FROM art.person where id like 'C%' ORDER BY id DESC LIMIT 1"
    );
    const id = idRows[0].id;
    await pool.query(
      "UPDATE art.person SET name = ?, dob = ?, address = ?, email = ? WHERE id = ?",
      [name, dob, address, email, id]
    );
    await pool.query("UPDATE art.phonenumber SET phone = ? WHERE id = ?", [
      phone,
      id,
    ]);
    res.redirect("/base");
  } catch (error) {
    console.error("Error in POST /cus:", error);
    res.status(500).send("An error occurred while processing your request.");
  }
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
      res.redirect("/base");
    } else {
      res.status(400).send("Customer already exists!");
    }
  } catch (error) {
    console.error("Error in POST /cust:", error);
    res.status(500).send("An error occurred while processing your request.");
  }
});

app.post("/login2", async (req, res) => {
  const { username, password } = req.body;
  try {
    const [results] = await pool.query(
      "SELECT * FROM art.customer WHERE username = ? AND password = ?",
      [username, password]
    );
    customerID = results[0].customerID;
    if (results.length > 0) {
      res.redirect("/base");
    } else {
      res.send("Incorrect Username or Password!");
    }
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("An error occurred during login");
  }
});

app.get("/exhibit", async (req, res) => {
  try {
    const [rows, fields] = await pool.query("SELECT * FROM art.exhibition");
    res.send(rows);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("An error occurred while processing your request.");
  }
});

app.get("/exhibit/:id", async (req, res) => {
  const exhibitionID = req.params.id;
  try {
    const [rows, fields] = await pool.query(
      "SELECT painting.name as pname, person.name as aname, price, genre, availability, creationYear, paintingID FROM painting inner join person on person.id = painting.artistID WHERE exhibitionID = ? and availability = 'Yes' ",
      [exhibitionID]
    );
    res.send(rows);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("An error occurred while processing your request.");
  }
});
app.post("/buy/:id", async (req, res) => {
  const paintingID = req.params.id;
  const currentDate = new Date().toISOString().split("T")[0];
  const id = await gen_tid(paintingID);
  try {
    await pool.query(
      "UPDATE painting SET availability = 'No' WHERE paintingID = ?",
      [paintingID]
    );

    await pool.query(
      "INSERT into art.purchases (transactionID, customerID, paintingID, date) VALUES (?, ?, ?, ?)",
      [id, customerID, paintingID, currentDate]
    );
    res.redirect("/base");
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("An error occurred while processing your request.");
  }
});

app.get("/purchase", async (req, res) => {
  try {
    const [rows, fields] = await pool.query(
      "SELECT customerID, exhibition.name as ename, painting.name as pname, person.name as aname, price, transactionID, date FROM purchases inner join painting on painting.paintingID = purchases.paintingID  inner join exhibition on exhibition.exhibitionID = painting.exhibitionID inner join person on person.id = painting.artistID  WHERE customerID = ?",
      [customerID]
    );
    res.send(rows);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("An error occurred while processing your request.");
  }
});

app.listen(8888, () => {
  console.log("Server is running on port 8888");
  console.log("Server link: http://localhost:8888/");
});
