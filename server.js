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
  res.sendFile(__dirname + "/login1.html");
});

app.get("/login", (req, res) => {
  res.sendFile(__dirname + "/login1.html");
});

app.get("/dash", (req, res) => {
  res.sendFile(__dirname + "/dashcopy.html");
});
app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    const [results] = await pool.query(
      "SELECT * FROM art.gallery WHERE username = ? AND password = ?",
      [username, password]
    );

    if (results.length > 0) {
      res.redirect("/dash");
    } else {
      res.send("Incorrect Username or Password!");
    }
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("An error occurred during login");
  }
});

async function generateId(name, email, phone, dob, address, style) {
  try {
    const [rows, fields] = await pool.query(
      "SELECT art.person.id FROM art.artist INNER JOIN art.person ON art.artist.artistId = art.person.id INNER JOIN art.phonenumber ON art.phonenumber.id = art.person.id WHERE name = ? AND email = ? AND dob = ? AND address = ?",
      [name, email, dob, address]
    );

    if (rows.length > 0) {
      return -1;
    }

    const [countRows] = await pool.query(
      "SELECT COUNT(*) as count FROM art.artist INNER JOIN art.person ON art.artist.artistId = art.person.id INNER JOIN art.phonenumber ON art.phonenumber.id = art.person.id"
    );
    const count = countRows[0].count;
    const id = "A" + ("000" + (count + 1)).slice(-3);
    return id;
  } catch (error) {
    throw error;
  }
}

async function gen_eid(name, email, phone, dob, address, position, join) {
  try {
    const [rows, fields] = await pool.query(
      "SELECT art.person.id FROM art.employee INNER JOIN art.person ON art.employee.employeeID = art.person.id INNER JOIN art.phonenumber ON art.phonenumber.id = art.person.id WHERE name = ? AND email = ? AND dob = ? AND address = ? AND position = ? AND joinDate = ?",
      [name, email, dob, address, position, join]
    );

    if (rows.length > 0) {
      return -1;
    }

    const [countRows] = await pool.query(
      "SELECT COUNT(*) as count FROM art.employee INNER JOIN art.person ON art.employee.employeeID = art.person.id INNER JOIN art.phonenumber ON art.phonenumber.id = art.person.id"
    );
    const count = countRows[0].count;
    const id = "E" + ("000" + (count + 1)).slice(-3);
    return id;
  } catch (error) {
    throw error;
  }
}

async function gen_pid(
  exhibitionID,
  artistId,
  name,
  price,
  creationYear,
  receivedYear,
  genre
) {
  try {
    const [rows, fields] = await pool.query(
      "SELECT art.painting.paintingID FROM art.painting WHERE exhibitionID = ? AND artistId = ? AND name = ? AND price = ? AND creationYear = ? AND receivedYear = ? AND genre = ?",
      [exhibitionID, artistId, name, price, creationYear, receivedYear, genre]
    );

    if (rows.length > 0) {
      return -1;
    }

    const [countRows] = await pool.query(
      "SELECT COUNT(*) as count FROM art.painting"
    );
    const count = countRows[0].count;
    const id = "P" + ("000" + (count + 1)).slice(-3);
    return id;
  } catch (error) {
    throw error;
  }
}

async function gen_exid(name, startDate, endDate) {
  try {
    const [rows, fields] = await pool.query(
      "SELECT exhibitionID FROM art.exhibition WHERE name = ? AND startDate = ? AND endDate = ?",
      [name, startDate, endDate]
    );

    if (rows.length > 0) {
      return -1; // Exhibition with the same details already exists
    }

    const [countRows] = await pool.query(
      "SELECT COUNT(*) as count FROM art.exhibition"
    );
    const count = countRows[0].count;
    const id = "X" + ("000" + (count + 1)).slice(-3);
    return id;
  } catch (error) {
    throw error;
  }
}

app.post("/form1", async (req, res) => {
  const { name, email, phone, dob, address, style } = req.body;

  try {
    const id = await generateId(name, email, phone, dob, address, style);

    if (id != -1) {
      await pool.query(
        "INSERT into art.person (id, name, dob, address, email) VALUES (?, ?, ?, ?, ?)",
        [id, name, dob, address, email]
      );
      await pool.query(
        "INSERT into art.artist (artistId, style) VALUES (?, ?)",
        [id, style]
      );
      await pool.query(
        "INSERT into art.phonenumber (id, phone) VALUES (?, ?)",
        [id, phone]
      );
      res.status(201).send("Artist added successfully");
    }
    if (id === -1) {
      return res.status(400).send("Artist already exists");
    }
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("An error occurred while processing your request.");
  }
});

app.get("/data", async (req, res) => {
  try {
    const [rows, fields] = await pool.query(
      "SELECT * FROM art.artist INNER JOIN art.person ON art.artist.artistId = art.person.id INNER JOIN art.phonenumber ON art.phonenumber.id = art.person.id"
    );
    res.send(rows);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("An error occurred while processing your request.");
  }
});

app.delete("/artist/:id", async (req, res) => {
  const artistId = req.params.id;

  try {
    const [existingRows] = await pool.query(
      "SELECT * FROM art.artist INNER JOIN art.person ON art.artist.artistId = art.person.id inner join art.phonenumber on art.person.id = art.phonenumber.id WHERE art.artist.artistId = ?",
      [artistId]
    );

    if (existingRows.length === 0) {
      return res.status(404).send("Artist not found");
    }
    await pool.query("DELETE FROM art.phonenumber WHERE id = ?", [artistId]);
    await pool.query("DELETE FROM art.artist WHERE artistId = ?", [artistId]);
    await pool.query("DELETE FROM art.person WHERE id = ?", [artistId]);

    res.status(200).send("Artist deleted successfully");
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("An error occurred while processing your request.");
  }
});

app.post("/form2", async (req, res) => {
  const {
    exhibition_id,
    artist_id,
    painting_name,
    price,
    year_of_creation,
    received_year,
    genre,
  } = req.body;

  try {
    const id = await gen_pid(
      exhibition_id,
      artist_id,
      painting_name,
      price,
      year_of_creation,
      received_year,
      genre
    );

    if (id != -1) {
      await pool.query(
        "INSERT into art.painting (paintingID, name, price, genre, creationYear, receivedYear, availability, artistID, exhibitionID) VALUES (?, ?, ?, ?, ?, ?, 'Yes', ?, ?)",
        [
          id,
          painting_name,
          price,
          genre,
          year_of_creation,
          received_year,
          artist_id,
          exhibition_id,
        ]
      );
    }
    if (id === -1) {
      return res.status(400).send("Painting already exists");
    }
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("An error occurred while processing your request.");
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

app.get("/exhi", async (req, res) => {
  try {
    const [rows, fields] = await pool.query("SELECT * FROM art.exhibition");
    res.send(rows);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("An error occurred while processing your request.");
  }
});

app.get("/customer", async (req, res) => {
  try {
    const [rows, fields] = await pool.query(
      "SELECT * FROM art.person inner join art.customer on art.person.id = art.customer.customerID inner join art.phonenumber on art.person.id = art.phonenumber.id"
    );
    res.send(rows);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("An error occurred while processing your request.");
  }
});

app.get("/paint", async (req, res) => {
  try {
    const [rows, fields] = await pool.query("SELECT * FROM art.painting");
    res.send(rows);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("An error occurred while processing your request.");
  }
});

app.post("/emp", async (req, res) => {
  const { name, email, phone, dob, address, position, join } = req.body;

  try {
    const id = await gen_eid(name, email, phone, dob, address, position, join);
    if (id != -1) {
      let managerID = null;
      if (position !== "Manager") {
        const [rows, fields] = await pool.query(
          "SELECT employeeID FROM art.employee WHERE position = 'Manager' LIMIT 1"
        );
        managerID = rows[0].employeeID;
      }

      await pool.query(
        "INSERT into art.person (id, name, dob, address, email) VALUES (?, ?, ?, ?, ?)",
        [id, name, dob, address, email]
      );
      await pool.query(
        "INSERT into art.employee (employeeID, position, galleryID, joinDate, managerID) VALUES (?, ?, 'G001', ?, ?)",
        [id, position, join, managerID]
      );
      await pool.query(
        "INSERT into art.phonenumber (id, phone) VALUES (?, ?)",
        [id, phone]
      );
      res.status(201).send("Employee added successfully");
    }
    if (id === -1) {
      return res.status(400).send("Employee already exists");
    }
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("An error occurred while processing your request.");
  }
});

app.get("/empdata", async (req, res) => {
  try {
    const [rows, fields] = await pool.query(
      "SELECT * FROM art.employee INNER JOIN art.person ON art.employee.employeeID = art.person.id INNER JOIN art.phonenumber ON art.phonenumber.id = art.person.id"
    );
    res.send(rows);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("An error occurred while processing your request.");
  }
});

app.delete("/employee/:id", async (req, res) => {
  const id = req.params.id;

  try {
    const [existingRows] = await pool.query(
      "SELECT * FROM art.employee INNER JOIN art.person ON art.employee.employeeID = art.person.id INNER JOIN art.phonenumber ON art.phonenumber.id = art.person.id WHERE art.employee.employeeID = ?",
      [id]
    );

    if (existingRows.length === 0) {
      return res.status(404).send("Employee not found");
    }
    await pool.query("DELETE FROM art.phonenumber WHERE id = ?", [id]);
    await pool.query("DELETE FROM art.employee WHERE employeeID = ?", [id]);
    await pool.query("DELETE FROM art.person WHERE id = ?", [id]);

    res.status(200).send("Artist deleted successfully");
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("An error occurred while processing your request.");
  }
});

app.post("/exhibit1", async (req, res) => {
  const { ename, sd, ed } = req.body;
  const id = await gen_exid(ename, sd, ed);
  try {
    await pool.query(
      "INSERT into art.exhibition (exhibitionID, name, startDate, endDate, galleryID) VALUES (?, ?, ?, ?, 'G001')",
      [id, ename, sd, ed]
    );
    res.status(201).send("Exhibition added successfully");
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("An error occurred while processing your request.");
  }
});
app.get("/purchase", async (req, res) => {
  try {
    const [rows, fields] = await pool.query(
      "SELECT customerID, painting.paintingID, painting.artistID, exhibition.name as ename, painting.name as pname, p.name as cname, price, transactionID, date FROM purchases inner join painting on painting.paintingID = purchases.paintingID  inner join exhibition on exhibition.exhibitionID = painting.exhibitionID inner join person p on p.id = purchases.customerID inner join person on person.id = painting.artistID"
    );
    res.send(rows);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("An error occurred while processing your request.");
  }
});
app.get("/count-employees", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT COUNT(*) as count FROM employee");
    res.json({ count: rows[0].count });
  } catch (error) {
    console.error("Error fetching employee count:", error);
    res.status(500).send("An error occurred while processing your request.");
  }
});

app.get("/count-paintings", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT COUNT(*) as count FROM painting");
    res.json({ count: rows[0].count });
  } catch (error) {
    console.error("Error fetching paintings count:", error);
    res.status(500).send("An error occurred while processing your request.");
  }
});

app.get("/count-artists", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT COUNT(*) as count FROM artist");
    res.json({ count: rows[0].count });
  } catch (error) {
    console.error("Error fetching artists count:", error);
    res.status(500).send("An error occurred while processing your request.");
  }
});

app.get("/total-sales", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT SUM(price) as total FROM purchases inner join painting on painting.paintingID = purchases.paintingID");
    res.json({ total: rows[0].total });
  } catch (error) {
    console.error("Error fetching total sales:", error);
    res.status(500).send("An error occurred while processing your request.");
  }
});

app.listen(7777, () => {
  console.log("Server is running on port 7777");
  console.log("Server link: http://localhost:7777/");
});
