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

module.exports.getUserIdByCookie = function(cookie, callback) {
    client.query("\
    SELECT user_id \
      FROM cookies \
     WHERE cookie = $1", [cookie], (err, res) => {
        if (err) {
            callback(err);
        } else {
            if (res.rows.length > 0) {
                callback(null, res.rows[0].user_id);
            } else {
              callback(new Error("Cookie is not found!"));
            }
        }
     }
    );
}

module.exports.getAuthors = function (callback) {
    client.query("\
      SELECT a.id, a.surname, a.name, a.birth_year, a.death_year, \
             COUNT(ba.book_id) AS book_number \
        FROM authors a \
        JOIN books_authors ba ON a.id = ba.author_id\
       GROUP BY a.id, a.surname, a.name, a.birth_year, a.death_year\
       ORDER BY a.surname, a.name, a.id", (err, res) => {
        if (err == null) {
            callback(res.rows);
        } else {
            console.log(err);
            callback([]);
        }
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

module.exports.addCookie = function (cookie, user_id, callback) {
    client.query("\
        DELETE \
          FROM cookies \
         WHERE user_id = $1 \
        ", [user_id], (err, res) => {
        if (err) {
            callback(err); 
        } else {
            client.query("\
            INSERT INTO cookies (id, user_id, cookie) \
                 VALUES (default, $1, $2)", [user_id, cookie], (error, result) => {
                if (error) {
                    callback(error);
                } else {
                    callback(null);
                }
            });
        }
    });
}

module.exports.getBooks = function (callback) {
    client.query("\
        SELECT b.id AS book_id, b.name AS book_name, \
               b.rating, b.rating_number, a.id AS author_id, \
               a.surname AS author_surname, a.name AS author_name \
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

module.exports.getProfile = function (user_id, callback) {
    client.query("\
        SELECT * \
          FROM users \
         WHERE id = $1", [user_id], (err, res) => {
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
    let book = {};
    client.query("\
    SELECT b.name as book_name, b.rating, b.rating_number, \
           ba.author_id, a.surname as author_surname, \
           a.name as author_name FROM books b  \
      JOIN books_authors ba ON book_id = b.id \
      JOIN authors a ON a.id = ba.author_id \
     WHERE b.id = $1 \
    ", [id], (err, res) => {
        if (err == null) {
            book.info = res.rows[0];
            client.query("\
            SELECT u.id, u.username, u.name, u.surname, \
                  br.id AS rating_id, \
                  br.rating, br.review, (u.id = 1) AS current_user  \
              FROM books_ratings br \
              JOIN users u ON br.user_id = u.id \
             WHERE book_id = $1 \
             ORDER BY CASE WHEN u.id = 1 THEN 1 ELSE 2 END, u.id\
            ", [id], (error, result) => {
                if (error == null) {
                    book.ratings = result.rows;
                    console.log(JSON.stringify(book, null, 4));
                    callback(book);
                } else {
                    console.log(err);
                    callback();
                }
            });
        } else {
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
            author_info = res.rows;
        } else {
            console.log(error);
            callback();
        }
    });
    client.query("\
    SELECT b.id, b.name, b.rating, b.rating_number \
      FROM books b \
      JOIN books_authors ba ON ba.book_id = b.id \
      JOIN authors a ON a.id = ba.author_id \
     WHERE a.id = $1 \
    ",[id], (err, res) => {
        if (err == null) {
            author_info[1] = res.rows;
            callback(author_info);
        } else {
            console.log(error);
            callback();
        }
    });
}

module.exports.getUserByID = function (id, callback) {
    client.query("\
    SELECT u.username, u.name, u.surname, \
           (SELECT COUNT(*) FROM shelves s WHERE s.user_id = u.id) AS shelves_number, \
           (SELECT COUNT(*) FROM books_ratings br WHERE br.user_id = u.id) AS ratings_number \
    FROM users u \
    WHERE u.id = $1", [id], (err, res) => {
        if (err == null) {
            console.log(res.rows);
            callback(res.rows);
        } else {
            console.log(err);
            callback();
        }
        });
}

module.exports.getBookByName = function (name, callback) {
    client.query("\
    SELECT b.id AS book_id, b.name AS book_name, \
           b.rating, b.rating_number, a.id AS author_id, \
           a.surname AS author_surname, a.name AS author_name \
      FROM authors a \
      JOIN books_authors ba ON a.id = ba.author_id \
      JOIN books b ON ba.book_id = b.id    \
     WHERE LOWER(b.name)    LIKE LOWER('%' || $1 || '%') \
        OR LOWER(a.name)    LIKE LOWER('%' || $1 || '%') \
        OR LOWER(a.surname) LIKE LOWER('%' || $1 || '%') \
        OR LOWER(CONCAT(a.name, ' ', a.surname))         \
            LIKE LOWER('%' || $1 || '%')                 \
        OR LOWER(CONCAT(a.surname, ' ', a.name))         \
            LIKE LOWER('%' || $1 || '%')                 \
     ", [name], (err, res) => {
        if (err == null) {
            callback(res.rows);
        } else {
            console.log(err);
            callback();
        }
    });
}

module.exports.getAuthorByName = function (name, callback) {
    client.query("\
      SELECT a.id, a.surname, a.name, a.birth_year, a.death_year, \
             COUNT(ba.book_id) AS book_number \
        FROM authors a \
        JOIN books_authors ba ON a.id = ba.author_id \
       WHERE LOWER(a.name)    LIKE LOWER('%' || $1 || '%') \
          OR LOWER(a.surname) LIKE LOWER('%' || $1 || '%') \
    GROUP BY a.id, a.surname, a.name, a.birth_year, a.death_year \
    ORDER BY a.surname, a.name, a.id \
     ", [name], (err, res) => {
        if (err == null) {
            callback(res.rows);
        } else {
            console.log(err);
            callback();
        }
    });
}

module.exports.deleteRating = function (ratingId, userId, callback) {
    console.log(ratingId, userId);
    client.query("\
    SELECT TRUE AS valid, book_id FROM books_ratings br \
    WHERE br.id = $1 AND br.user_id = $2 \
    ", [ratingId, userId], (err, res) => {
        let bookId = res.rows[0].book_id;
        console.log(bookId);
        if (err) {
            callback(0, false);
        } else {
            client.query("\
            DELETE FROM books_ratings br \
            WHERE br.id = $1", [ratingId], (error, result) => {
                if (error) {
                    callback(0, false);
                } else {
                    console.log(bookId);
                    callback(bookId, true);
                }
            });
        }
    });
}

module.exports.getShelves = function (userId, callback) {
    client.query("                                   \
    SELECT *, \
           (SELECT COUNT(*) \
              FROM shelves_books sb \
             WHERE sb.shelf_id = s.id) AS book_number\
        FROM shelves s\
        WHERE s.user_id = $1 AND public = TRUE;\
    ", [userId], (err, res) => {
        if (err) {
            callback(res.rows);
        } else {
            callback(new Error("Not Found!"));
        }
    });
}