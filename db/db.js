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
        SELECT id, surname, name, birth_year, death_year \
        FROM authors \
        ORDER BY id", (err, res) => {
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
        SELECT b.id as book_id, b.name as book_name, b.rating, b.rating_number, a.id as author_id, \
               a.surname as author_surname, a.name as author_name \
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

module.exports.getBookByID = function (id, callback) {
    let book_info = [];
    client.query("\
    SELECT b.name as book_name, b.rating, b.rating_number, ba.author_id, a.surname as author_surname, \
           a.name as author_name FROM books b  \
    JOIN books_authors ba ON book_id = b.id \
    JOIN authors a ON a.id = ba.author_id \
    WHERE b.id = $1 \
    ", [id], (err, res) => {
        //console.log(res);
        if (err == null) {
            //console.log(res.rows);
            book_info[0] = res.rows;
        } else {
            console.log(error);
            callback();
        }
        console.log(book_info);
    });
    client.query("\
    SELECT u.id, u.username, u.name, u.surname, br.rating, br.review \
    FROM books_ratings br\
    JOIN users u ON br.user_id = u.id \
    WHERE book_id = $1; \
    ", [id], (err, res) => {
        if (err == null) {
            book_info[1] = res.rows;
            callback(book_info);
        } else {
            console.log(err);
            callback();
        }
    });
}

module.exports.getAuthorByID = function (id, callback) {
    let author_info = []
    client.query("\
    SELECT surname, name, birth_year, death_year \
    FROM authors a \
    WHERE a.id = $1 \
    ", [id], (err, res) => {
        if (err == null) {
            //console.log(res.rows);
            author_info = res.rows;
        } else {
            console.log(error);
            callback();
        }
    });
    client.query("\
    SELECT b.id, b.name, b.rating, b.rating_number from books b \
    JOIN books_authors ba ON ba.book_id = b.id \
    JOIN authors a ON a.id = ba.author_id \
    WHERE a.id = $1 \
    ",[id], (err, res) => {
        if (err == null) {
            author_info[1] = res.rows;
            //console.log(author_info);
            callback(author_info);
        } else {
            console.log(error);
            callback();
        }
    });
}