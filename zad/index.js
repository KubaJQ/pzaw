import express from "express";
import bodyParser from "body-parser";
import path from "path";
import { fileURLToPath } from "url";

// Ustalanie ścieżek (potrzebne w ES Modules)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Tworzenie aplikacji Express
const app = express();
const PORT = 8000;

// Ustawienia aplikacji
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Dane w pamięci — lista postów
let posts = [
  { title: "Witaj na blogu!", content: "To jest przykładowy pierwszy post. Możesz dodać swój!", date: new Date().toLocaleString() }
];

// 🔹 Strona główna
app.get("/", (req, res) => {
  res.render("index", { posts });
});

// 🔹 Strona informacyjna
app.get("/about", (req, res) => {
  res.render("about");
});

// 🔹 Dodawanie nowego posta
app.post("/add", (req, res) => {
  const { title, content } = req.body;
  if (title && content) {
    posts.unshift({ title, content, date: new Date().toLocaleString() });
  }
  res.redirect("/");
});

// 🔹 Usuwanie posta po tytule
app.post("/delete", (req, res) => {
  const { title } = req.body;
  posts = posts.filter(post => post.title !== title);
  res.redirect("/");
});

// 🔹 Obsługa błędów 404
app.use((req, res) => {
  res.status(404).send("<h1>404 - Nie znaleziono strony</h1><a href='/'>Powrót</a>");
});

// 🔹 Uruchomienie serwera
app.listen(PORT, () => {
  console.log(`✅ Serwer działa: http://localhost:${PORT}`);
});
