const http = require("http");
const mysql = require("mysql2");

const PORT = 3001;

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "Nikki@1508*",
  database: "notesapp",
});

db.connect(err => {
  if (err) throw err;
  console.log("MySQL connected");
});

/* SAFE BODY PARSER */
function parseBody(req, cb) {
  let body = "";

  req.on("data", chunk => {
    body += chunk.toString();
  });

  req.on("end", () => {
    try {
      const data = JSON.parse(body || "{}");
      cb(data);
    } catch {
      cb({});
    }
  });
}

const server = http.createServer((req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");

  if (req.method === "OPTIONS") {
    res.writeHead(200);
    return res.end();
  }

  /* REGISTER */
  if (req.method === "POST" && req.url === "/register") {
    parseBody(req, data => {
      if (!data.username?.trim() || !data.password?.trim()) {
        res.writeHead(400);
        return res.end("Username & password required");
      }

      db.query(
        "SELECT id FROM users WHERE username=?",
        [data.username],
        (err, rows) => {
          if (rows.length) return res.end("User exists");

          db.query(
            "INSERT INTO users (username,password) VALUES (?,?)",
            [data.username, data.password],
            () => res.end("Registered")
          );
        }
      );
    });
  }

  /* LOGIN */
  if (req.method === "POST" && req.url === "/login") {
    parseBody(req, data => {
      if (!data.username?.trim() || !data.password?.trim()) {
        return res.end(JSON.stringify(null));
      }

      db.query(
        "SELECT * FROM users WHERE username=? AND password=?",
        [data.username, data.password],
        (err, result) => {
          res.end(JSON.stringify(result[0] || null));
        }
      );
    });
  }

  /* ADD NOTE */
  if (req.method === "POST" && req.url === "/add-note") {
    parseBody(req, data => {
      db.query(
        "INSERT INTO notes (user_id,content) VALUES (?,?)",
        [data.userId, data.content],
        () => res.end("Added")
      );
    });
  }

  /* DELETE NOTE */
  if (req.method === "POST" && req.url === "/delete-note") {
    parseBody(req, data => {
      db.query(
        "DELETE FROM notes WHERE id=?",
        [data.id],
        () => res.end("Deleted")
      );
    });
  }

  /* GET NOTES */
  if (req.method === "GET" && req.url.startsWith("/notes")) {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const userId = url.searchParams.get("user");

    db.query(
      "SELECT * FROM notes WHERE user_id=?",
      [userId],
      (err, result) => res.end(JSON.stringify(result))
    );
  }

  /* CHANGE PASSWORD */
  if (req.method === "POST" && req.url === "/change-password") {
    parseBody(req, data => {
      if (!data.userId || !data.oldPassword || !data.newPassword) {
        res.writeHead(400);
        return res.end("All fields required");
      }

      db.query(
        "SELECT password FROM users WHERE id=?",
        [data.userId],
        (err, rows) => {
          if (err || !rows.length || rows[0].password !== data.oldPassword) {
            return res.end("Wrong password");
          }

          db.query(
            "UPDATE users SET password=? WHERE id=?",
            [data.newPassword, data.userId],
            () => res.end("Password changed")
          );
        }
      );
    });
  }

  /* DELETE ACCOUNT */
  if (req.method === "POST" && req.url === "/delete-account") {
    parseBody(req, data => {
      if (!data.userId || !data.password) {
        res.writeHead(400);
        return res.end("Password required");
      }

      db.query(
        "SELECT password FROM users WHERE id=?",
        [data.userId],
        (err, rows) => {
          if (err || !rows.length || rows[0].password !== data.password) {
            return res.end("Wrong password");
          }

          // Delete all user's notes first
          db.query(
            "DELETE FROM notes WHERE user_id=?",
            [data.userId],
            () => {
              // Then delete the user
              db.query(
                "DELETE FROM users WHERE id=?",
                [data.userId],
                () => res.end("Account deleted")
              );
            }
          );
        }
      );
    });
  }
});

server.listen(PORT, () =>
  console.log("Server running at http://localhost:" + PORT)
);