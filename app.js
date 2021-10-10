const express = require("express");
const bodyParser = require('body-parser');

const app = express();

app.use(bodyParser.json());
app.use(express.urlencoded({extended: false}));
app.use(express.json());

app.set("port", 80);

app.get("/", (req, res) => {
    res.sendFile('./html/main.html', {root: "./"});
  });

app.listen(app.get("port"), () => {
  console.log(`Server running at http://localhost:${app.get("port")}`);
});

