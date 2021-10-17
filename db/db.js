const { Client } = require("pg");
const client = new Client({
    user: "auimxcthzusdcl",
    password: "a15bbfba34d5f9eb238c775ee527c83442c6fb99ef20036e030253bb80ec32ce",
    host: "ec2-52-208-221-89.eu-west-1.compute.amazonaws.com",
    port: "5432",
    database: "df7cfkmb5tsbgf",
    ssl: { rejectUnauthorized: false }
});
client.connect();

module.exports.getAuthors = function (callback) {
    client.query("\
        SELECT surname, name, birth_year, death_year \
        FROM authors", (err, res) => {
        callback(res.rows);
    });
}

module.exports.getUser = function (email, callback) {
    client.query("\
        SELECT * \
        FROM users \
        WHERE email = $1", [email], (err, res) => {
        callback(res.rows);
    });
}

module.exports.getBooks = function (callback) {
    client.query("\
        SELECT b.name as book_name, b.rating, a.surname as author_surname, a.name as author_name \
        FROM authors a \
        JOIN books_authors ba ON a.id = ba.author_id \
        JOIN books b ON ba.book_id = b.id \
        ORDER BY a.surname, a.name, b.name", (err, res) => {
        callback(res.rows);
    });
}

module.exports.getPublishings = function (callback) {
    client.query("\
        SELECT name, founded, location \
        FROM publishings", (err, res) => {
        callback(res.rows);
    });
}

module.exports.getProfile = function (callback) {
    client.query("\
        SELECT * \
        FROM users", (err, res) => {
        callback(res.rows);
    });
}

module.exports.addUser = function (user, callback) {
    client.query("\
    INSERT INTO users \
    VALUES (DEFAULT, $1, $2, $3, $4, $5, FALSE)", 
    [user.login, user.password, 
        user.surname, user.name, 
        user.email], (err, res) => {
        callback(err);
    });
}