import express from "express";

const app = express();
const port = 8000;

app.use(express.static("public"));
app.use(express.urlencoded({ extended: true })); 

let items = [
  { id: 1, text: "Element 1" },
  { id: 2, text: "Element 2" },
  { id: 3, text: "Element 3" }
];
let nextId = 4;

app.set("view engine", "ejs");

app.get("/", (req, res) => {
  res.render("index", {
    title: "Strona główna",
    items: items
  });
});

app.get("/items", (req, res) => {
  res.render("messages", {
    title: "Lista elementów",
    items: items
  });
});

app.post("/items", (req, res) => {
  const newItem = req.body.item;
  if (newItem && newItem.trim() !== "") {
    items.push({ id: nextId, text: newItem.trim() });
    nextId++;
  }
  res.redirect("/"); 
});

app.get("/items/edit/:id", (req, res) => {
  const item = items.find(i => i.id === parseInt(req.params.id));
  if (item) {
    res.render("edit", {
      title: "Edytuj element",
      item: item,
      items: items
    });
  } else {
    res.status(404).send("Element nie znaleziony");
  }
});

app.post("/items/edit/:id", (req, res) => {
  const item = items.find(i => i.id === parseInt(req.params.id));
  if (item && req.body.item && req.body.item.trim() !== "") {
    item.text = req.body.item.trim();
  }
  res.redirect("/");
});

app.get("/items/delete/:id", (req, res) => {
  items = items.filter(i => i.id !== parseInt(req.params.id));
  res.redirect("/");
});

app.use((req, res) => {
  res.status(404).type("text/plain").send("Site not found");
});

app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});
