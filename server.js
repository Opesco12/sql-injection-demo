const express = require("express");
const path = require("path");

const app = express();
const PORT = 3000;
const isVercel = Boolean(process.env.VERCEL);

const seedUsers = [
  { id: 1, username: "admin", password: "admin123", role: "administrator" },
  { id: 2, username: "emmanuel", password: "pass123", role: "developer" },
  { id: 3, username: "guest", password: "guest123", role: "viewer" },
];

let db;

if (isVercel) {
  // Vercel serverless cannot reliably load native sqlite3 binaries across all runtimes.
  // For deployment stability, we run an in-memory educational dataset there.
  db = {
    allUsers: () => seedUsers,
    findByCredentials: (username, password) =>
      seedUsers.find((user) => user.username === username && user.password === password) || null,
    vulnerableLogin: (username, password) => {
      const generatedQuery = `SELECT * FROM users WHERE username = '${username}' AND password = '${password}';`;

      const tautology = /'\s*or\s*'1'\s*=\s*'1'\s*--/i.test(username);
      if (tautology) {
        return { generatedQuery, row: seedUsers[0] };
      }

      const commentBypass = username.match(/^([^']+)'\s*--/);
      if (commentBypass) {
        const matched = seedUsers.find((user) => user.username === commentBypass[1].trim()) || null;
        return { generatedQuery, row: matched };
      }

      return { generatedQuery, row: db.findByCredentials(username, password) };
    },
  };

  console.log("Running in Vercel mode with in-memory dataset.");
} else {
  const sqlite3 = require("sqlite3").verbose();
  const DB_PATH = path.join(__dirname, "database.db");

  const sqliteDb = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
      console.error("Failed to connect to database:", err.message);
      process.exit(1);
    }

    console.log(`Connected to SQLite at ${DB_PATH}`);
  });

  sqliteDb.serialize(() => {
    sqliteDb.run(
      `CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL
      )`
    );

    sqliteDb.get("SELECT COUNT(*) AS count FROM users", (countErr, row) => {
      if (countErr) {
        console.error("Failed to count users:", countErr.message);
        return;
      }

      if (row.count === 0) {
        const seedStatement = sqliteDb.prepare(
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
  });

  db = {
    allUsers: () =>
      new Promise((resolve, reject) => {
        sqliteDb.all(
          "SELECT id, username, password, role FROM users ORDER BY id ASC",
          (err, rows) => {
            if (err) return reject(err);
            resolve(rows);
          }
        );
      }),
    findByCredentials: (username, password) =>
      new Promise((resolve, reject) => {
        sqliteDb.get(
          "SELECT * FROM users WHERE username = ? AND password = ?",
          [username, password],
          (err, row) => {
            if (err) return reject(err);
            resolve(row || null);
          }
        );
      }),
    vulnerableLogin: (username, password) =>
      new Promise((resolve, reject) => {
        // INTENTIONALLY VULNERABLE FOR EDUCATIONAL LOCAL DEMO ONLY:
        // User input is directly interpolated into SQL, allowing SQL injection.
        const generatedQuery = `SELECT * FROM users WHERE username = '${username}' AND password = '${password}';`;

        sqliteDb.get(generatedQuery, (err, row) => {
          if (err) return reject({ err, generatedQuery });
          resolve({ generatedQuery, row: row || null });
        });
      }),
  };
}

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

app.get("/api/users", async (req, res) => {
  try {
    const users = isVercel ? db.allUsers() : await db.allUsers();
    return res.json({ success: true, users });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Failed to fetch users." });
  }
});

app.post("/api/login-vulnerable", async (req, res) => {
  const { username = "", password = "" } = req.body || {};

  try {
    const result = isVercel
      ? db.vulnerableLogin(username, password)
      : await db.vulnerableLogin(username, password);

    const success = Boolean(result.row);
    return res.json({
      success,
      message: success ? "Login succeeded." : "Login failed.",
      mode: "vulnerable",
      generatedQuery: result.generatedQuery,
      result: result.row,
    });
  } catch (errorObj) {
    const message = errorObj?.err?.message || "Unexpected SQL error.";
    return res.status(500).json({
      success: false,
      message: `SQL error: ${message}`,
      mode: "vulnerable",
      generatedQuery: errorObj.generatedQuery,
      result: null,
    });
  }
});

app.post("/api/login-safe", async (req, res) => {
  const { username = "", password = "" } = req.body || {};
  const generatedQuery = "SELECT * FROM users WHERE username = ? AND password = ?";
  const parameters = [username, password];

  // SAFE APPROACH:
  // Parameterized queries separate SQL structure from user input values.
  // Inputs are treated as data, not executable SQL code, which prevents injection.
  try {
    const row = isVercel
      ? db.findByCredentials(username, password)
      : await db.findByCredentials(username, password);

    const success = Boolean(row);
    return res.json({
      success,
      message: success ? "Login succeeded." : "Login failed.",
      mode: "protected",
      generatedQuery,
      parameters,
      result: row,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: `SQL error: ${err.message}`,
      mode: "protected",
      generatedQuery,
      parameters,
      result: null,
    });
  }
});

app.post("/api/login", async (req, res) => {
  const { username = "", password = "" } = req.body || {};

  try {
    const row = isVercel
      ? db.findByCredentials(username, password)
      : await db.findByCredentials(username, password);

    if (!row) {
      return res.status(401).json({
        success: false,
        message: "Invalid username or password.",
      });
    }

    return res.json({
      success: true,
      message: "Login successful.",
      user: {
        id: row.id,
        username: row.username,
        role: row.role,
      },
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Login failed due to a server error.",
    });
  }
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    console.log("This app is for local educational demonstration only.");
  });
}

module.exports = app;
