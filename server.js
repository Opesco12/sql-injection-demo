const express = require("express");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();

const app = express();
const PORT = 3000;
const DB_PATH = path.join(__dirname, "database.db");

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error("Failed to connect to database:", err.message);
    process.exit(1);
  }

  console.log(`Connected to SQLite at ${DB_PATH}`);
});

function initializeDatabase() {
  db.serialize(() => {
    db.run(
      `CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL
      )`,
      (tableErr) => {
        if (tableErr) {
          console.error("Failed to create users table:", tableErr.message);
          return;
        }

        db.get("SELECT COUNT(*) AS count FROM users", (countErr, row) => {
          if (countErr) {
            console.error("Failed to count users:", countErr.message);
            return;
          }

          if (row.count === 0) {
            const seedStatement = db.prepare(
              "INSERT INTO users (username, password, role) VALUES (?, ?, ?)"
            );

            seedStatement.run("admin", "admin123", "administrator");
            seedStatement.run("emmanuel", "pass123", "developer");
            seedStatement.run("guest", "guest123", "viewer");

            seedStatement.finalize((seedErr) => {
              if (seedErr) {
                console.error("Failed to seed users:", seedErr.message);
                return;
              }

              console.log("Seeded users table with demo accounts.");
            });
          }
        });
      }
    );
  });
}

initializeDatabase();

app.use(express.json());
app.use(express.static(path.join(__dirname, "public"), { index: false }));

app.get("/", (req, res) => {
  res.redirect("/login");
});

app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "login.html"));
});

app.get("/dashboard", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "dashboard.html"));
});

app.get("/demo", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "demo.html"));
});

app.get("/api/users", (req, res) => {
  db.all(
    "SELECT id, username, password, role FROM users ORDER BY id ASC",
    (err, rows) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: "Failed to fetch users.",
        });
      }

      return res.json({
        success: true,
        users: rows,
      });
    }
  );
});

app.post("/api/login-vulnerable", (req, res) => {
  const { username = "", password = "" } = req.body || {};

  // INTENTIONALLY VULNERABLE FOR EDUCATIONAL LOCAL DEMO ONLY:
  // User input is directly interpolated into SQL, allowing SQL injection.
  const generatedQuery = `SELECT * FROM users WHERE username = '${username}' AND password = '${password}';`;

  db.get(generatedQuery, (err, row) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: `SQL error: ${err.message}`,
        mode: "vulnerable",
        generatedQuery,
        result: null,
      });
    }

    const success = Boolean(row);
    return res.json({
      success,
      message: success ? "Login succeeded." : "Login failed.",
      mode: "vulnerable",
      generatedQuery,
      result: row || null,
    });
  });
});

app.post("/api/login-safe", (req, res) => {
  const { username = "", password = "" } = req.body || {};
  const generatedQuery = "SELECT * FROM users WHERE username = ? AND password = ?";
  const parameters = [username, password];

  // SAFE APPROACH:
  // Parameterized queries separate SQL structure from user input values.
  // Inputs are treated as data, not executable SQL code, which prevents injection.
  db.get(generatedQuery, parameters, (err, row) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: `SQL error: ${err.message}`,
        mode: "protected",
        generatedQuery,
        parameters,
        result: null,
      });
    }

    const success = Boolean(row);
    return res.json({
      success,
      message: success ? "Login succeeded." : "Login failed.",
      mode: "protected",
      generatedQuery,
      parameters,
      result: row || null,
    });
  });
});

app.post("/api/login", (req, res) => {
  const { username = "", password = "" } = req.body || {};
  const query = "SELECT id, username, role FROM users WHERE username = ? AND password = ?";

  db.get(query, [username, password], (err, row) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Login failed due to a server error.",
      });
    }

    if (!row) {
      return res.status(401).json({
        success: false,
        message: "Invalid username or password.",
      });
    }

    return res.json({
      success: true,
      message: "Login successful.",
      user: row,
    });
  });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log("This app is for local educational demonstration only.");
});
