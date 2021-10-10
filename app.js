const express = require("express");
const bodyParser = require('body-parser');
const PORT = process.env.PORT || 5000; 
const app = express();

app.use(bodyParser.json());
app.use(express.urlencoded({extended: false}));
app.use(express.json());

app.get("/", (req, res) => {
    res.sendFile('./html/main.html', {root: "./"});
  });

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

