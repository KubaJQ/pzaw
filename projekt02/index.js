import express from "express";

const app = express();
const port = 8000;

app.use(express.static("public"));
app.use(express.urlencoded({ extended: true })); 

let messages = ["Witaj w aplikacji Express!", "To jest pierwszy wpis."];

app.set("view engine", "ejs");

app.get("/", (req, res) => {
  res.render("index", {
    title: "Strona główna",
    messages: messages
  });
});

app.get("/messages", (req, res) => {
  res.render("messages", {
    title: "Wiadomości",
    messages: messages
  });
});

app.post("/messages", (req, res) => {
  const newMessage = req.body.message;
  if (newMessage && newMessage.trim() !== "") {
    messages.push(newMessage.trim());
  }
  res.redirect("/"); 
});

app.use((req, res) => {
  res.status(404).type("text/plain").send("Site not found");
});

app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});
