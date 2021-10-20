const express = require("express");
const bodyParser = require("body-parser");
const PORT = process.env.PORT || 5000;
const app = express();
const db = require("./db/db");

app.use(bodyParser.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(express.static(__dirname + '/public'));

app.set('view engine', 'pug');

app.get("/", (req, res) => {
  res.sendFile("./html/main.html", { root: "./" });
});

app.get("/login", (req, res) => {
  res.sendFile("./html/login.html", { root: "./" });
});

app.post("/login", (req, res) => {
  db.getUser(req.body.login, (user) => {
    if (user.length > 0) {
      if (user[0].password == req.body.password) {
        res.send("OK");
      } else {
        res.send("Password is not correct");
      }
    } else {
      res.send("User is not found");
    }
  });
});

app.get("/authors", (req, res) => {
  db.getAuthors((result) => {
    res.render("authors", { values: result });
  });
});

app.get("/books", (req, res) => {
  db.getBooks((result) => {
    res.render("books", { values: result });
  });
});

app.get("/publishings", (req, res) => {
  db.getPublishings((result) => {
    res.render("publishings", { values: result });
  });
});

app.get("/profile", (req, res) => {
  db.getProfile((result) => {
    res.render("profile", { values: result });
  });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

app.get("/registration", (req, res) => {
  res.sendFile("./html/registration.html", { root: "./" })
});

app.post("/registration", (req, res) => {
  db.addUser(req.body, (error) => {
     if (error == null) {
       res.send("Your account was created");
     } else {
       res.send("Error. Try again");
     }
  });
});

app.get("/books/:id", (req, res) => {
  console.log(req.params.id);
  db.getBookByID(req.params.id, (result) => {
    console.log(result);
    res.render("book", {
      book: result[0][0],
      rating: result[1]
    });
  });
});

app.get("/authors/:id", (req, res) => {
  console.log(req.params.id)
  db.getAuthorByID(req.params.id, (result) => {
    console.log(result[1] != []);
    res.render("author", {
      author: result[0],
      books: result[1]
    });
  });
});
