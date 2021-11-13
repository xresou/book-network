const { v4: uuidv4 } = require("uuid");
const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const PORT = process.env.PORT || 5000;
const app = express();
const db = require("./db/db");

app.use(bodyParser.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cookieParser());
app.use(express.static(__dirname + '/public'));

app.set("view engine", "pug");

app.get("/", (req, res) => {
  res.sendFile("./html/new_main.html", { root: "./" });
});

app.get("/login", (req, res) => {
  res.sendFile("./html/login.html", { root: "./" });
});

app.post("/login", (req, res) => {
  db.getUser(req.body.login, (user) => {
    if (user.length > 0) {
      if (user[0].password == req.body.password) {
        let cookie = uuidv4();
        db.addCookie(cookie, user[0].id, (err) => {
          console.log(err);
          if (err) {
            res.send("Error!");
          } else {
            res.cookie("Auth", cookie);
            res.redirect(301, "/books");
          }
        });
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
    res.render("books_new", { values: result });
  });
});

app.get("/publishings", (req, res) => {
  db.getPublishings((result) => {
    res.render("publishings", { values: result });
  });
});

app.get("/profile", (req, res) => {
  console.log(req.cookies);
  db.getUserIdByCookie(req.cookies.Auth, (err, user_id) => {
    if (err) {
      console.log(err);
      res.send("Error: " + err.message);
    } else {
      db.getProfile(user_id, (result) => {
        res.render("profile", { values: result });
      });
    }
  });
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
  db.getBookByID(req.params.id, (result) => {
    res.render("book", {
      book: result[0],
      rating: result[1]
    });
  });
});

app.get("/authors/:id", (req, res) => {
  db.getAuthorByID(req.params.id, (result) => {
    res.render("author", {
      author: result[0],
      books: result[1]
    });
  });
});

app.get("/users/:id", (req, res) => {
  db.getUserByID(req.params.id, (result) => {
    res.render("user", {user: result[0]});
  });
});

app.post("/books", (req, res) => {
  db.getBookByName(req.body.search, (result) => {
    res.render("books_new", { values: result });
  });
});

app.post("/authors", (req, res) => {
  db.getAuthorByName(req.body.search, (result) => {
    res.render("authors", { values: result });
  });
});

app.post("/rating_del/:id", (req, res) => {
  db.deleteRating(req.params.id, (result) => {
    res.send(result ? "Отзыв удален" : "Отзыв не был удален");
  });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});