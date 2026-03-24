import express from "express";
import session from "express-session";
import SQLiteStoreInit from "connect-sqlite3";
import bcrypt from "bcrypt";
import sqlite3 from "sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const port = process.env.PORT || 8000;

const db = new sqlite3.Database(path.join(__dirname, "database.sqlite"));


db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('user','admin'))
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      text TEXT NOT NULL,
      user_id INTEGER NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);
});

const SQLiteStore = SQLiteStoreInit(session);

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));
app.use(
  session({
    store: new SQLiteStore({ db: "sessions.sqlite", dir: __dirname }),
    secret: "change-this-secret",
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 24 * 60 * 60 * 1000 }
  })
);

app.use((req, res, next) => {
  res.locals.currentUser = req.session.user;
  next();
});

function createUser(username, password, role = "user", callback) {
  bcrypt.hash(password, 10, (err, hash) => {
    if (err) return callback(err);
    const stmt = db.prepare("INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)");
    stmt.run(username, hash, role, function(err) {
      callback(err, this.lastID);
    });
  });
}

function getUserByUsername(username, callback) {
  db.get("SELECT id, username, password_hash, role FROM users WHERE username = ?", [username], callback);
}

function getUserById(id, callback) {
  db.get("SELECT id, username, role FROM users WHERE id = ?", [id], callback);
}

function getAllItems(callback) {
  db.all(
    `SELECT i.id, i.text, i.user_id, i.created_at, u.username AS owner, u.role AS owner_role
     FROM items i
     INNER JOIN users u ON i.user_id = u.id
     ORDER BY i.created_at DESC`,
    callback
  );
}

function getItem(id, callback) {
  db.get("SELECT * FROM items WHERE id = ?", [id], callback);
}

function insertItem(text, userId, callback) {
  const stmt = db.prepare("INSERT INTO items (text, user_id) VALUES (?, ?)");
  stmt.run(text, userId, function(err) {
    callback(err, this.lastID);
  });
}

function updateItem(id, text, callback) {
  const stmt = db.prepare("UPDATE items SET text = ? WHERE id = ?");
  stmt.run(text, id, callback);
}

function deleteItem(id, callback) {
  const stmt = db.prepare("DELETE FROM items WHERE id = ?");
  stmt.run(id, callback);
}

function requireAuth(req, res, next) {
  if (!req.session.user) {
    return res.redirect("/login");
  }
  next();
}

function requireOwnershipOrAdmin(req, res, next) {
  getItem(req.params.id, (err, item) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Błąd bazy danych");
    }
    if (!item) {
      return res.status(404).send("Element nie znaleziony");
    }
    const currentUser = req.session.user;
    if (currentUser.role === "admin" || item.user_id === currentUser.id) {
      req.item = item;
      return next();
    }
    return res.status(403).send("Brak uprawnień do edycji tego elementu");
  });
}

function ensureAdmin() {
  getUserByUsername("admin", (err, user) => {
    if (err) console.error("Błąd przy sprawdzaniu admina", err);
    if (!user) {
      createUser("admin", "admin123", "admin", (err) => {
        if (err) console.error("Błąd przy tworzeniu admina", err);
      });
    }
  });
}

ensureAdmin();

app.get("/", (req, res) => {
  getAllItems((err, items) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Błąd bazy danych");
    }
    res.render("index", { title: "Strona główna projekt04", items });
  });
});

app.get("/items", (req, res) => {
  getAllItems((err, items) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Błąd bazy danych");
    }
    res.render("items", { title: "Wszystkie elementy", items });
  });
});

app.post("/items", requireAuth, (req, res) => {
  const text = (req.body.text || "").trim();
  if (!text) return res.redirect("/");
  insertItem(text, req.session.user.id, (err) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Błąd bazy danych");
    }
    res.redirect("/");
  });
});

app.get("/items/edit/:id", requireAuth, requireOwnershipOrAdmin, (req, res) => {
  res.render("edit", { title: "Edytuj element", item: req.item });
});

app.post("/items/edit/:id", requireAuth, requireOwnershipOrAdmin, (req, res) => {
  const text = (req.body.text || "").trim();
  if (text) {
    updateItem(req.params.id, text, (err) => {
      if (err) {
        console.error(err);
        return res.status(500).send("Błąd bazy danych");
      }
      res.redirect("/");
    });
  } else {
    res.redirect("/");
  }
});

app.post("/items/delete/:id", requireAuth, requireOwnershipOrAdmin, (req, res) => {
  deleteItem(req.params.id, (err) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Błąd bazy danych");
    }
    res.redirect("/");
  });
});

app.get("/register", (req, res) => {
  res.render("register", { title: "Rejestracja" });
});

app.post("/register", (req, res) => {
  const username = (req.body.username || "").trim();
  const password = req.body.password || "";
  if (!username || !password) {
    return res.redirect("/register");
  }
  getUserByUsername(username, (err, existing) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Błąd bazy danych");
    }
    if (existing) {
      return res.render("register", { title: "Rejestracja", error: "Użytkownik już istnieje" });
    }
    createUser(username, password, "user", (err) => {
      if (err) {
        console.error(err);
        return res.status(500).send("Błąd bazy danych");
      }
      res.redirect("/login");
    });
  });
});

app.get("/login", (req, res) => {
  res.render("login", { title: "Logowanie" });
});

app.post("/login", (req, res) => {
  const username = (req.body.username || "").trim();
  const password = req.body.password || "";
  getUserByUsername(username, (err, user) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Błąd bazy danych");
    }
    if (!user) {
      return res.render("login", { title: "Logowanie", error: "Nieprawidłowe dane" });
    }
    bcrypt.compare(password, user.password_hash, (err, ok) => {
      if (err) {
        console.error(err);
        return res.status(500).send("Błąd bazy danych");
      }
      if (!ok) {
        return res.render("login", { title: "Logowanie", error: "Nieprawidłowe dane" });
      }
      req.session.user = { id: user.id, username: user.username, role: user.role };
      res.redirect("/");
    });
  });
});

app.get("/logout", (req, res) => {
  req.session.destroy(() => res.redirect("/"));
});

app.get("/seed", (req, res) => {
  getUserByUsername("admin", (err, admin) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Błąd bazy danych");
    }
    if (!admin) {
      return res.status(500).send("Brak admina, seed nie wykonany");
    }
    insertItem("Przykładowy element 1", admin.id, (err) => {
      if (err) console.error(err);
      insertItem("Przykładowy element 2", admin.id, (err) => {
        if (err) console.error(err);
        res.redirect("/");
      });
    });
  });
});

app.use((req, res) => {
  res.status(404).type("text/plain").send("Nie znaleziono strony");
});

app.listen(port, () => {
  console.log(`Serwer wystartował na http://localhost:${port}`);
});
