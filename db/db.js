const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME
});

client.connect(); 

module.exports.getUserIdByCookie = function(cookie, callback) {
    client.query(`
        SELECT user_id 
          FROM books.cookies 
         WHERE cookie = $1
        `, [cookie], (err, res) => {
            if (err == null) {
                if (res.rows.length > 0) {
                    callback(null, res.rows[0].user_id);
                } else {
                    callback(err);
                }
            } else {
                callback(err);                
            }
        }
    );
}

module.exports.getAuthors = function(callback) {
    client.query(`
        SELECT a.id, a.surname, a.name, a.birth_year, a.death_year, 
               COUNT(ba.book_id) AS book_number
          FROM books.authors a 
          JOIN books.books_authors ba ON a.id = ba.author_id
         GROUP BY a.id, a.surname, a.name, a.birth_year, a.death_year
         ORDER BY a.surname, a.name, a.id
       `, (err, res) => {
            if (err == null) {
                callback(res.rows);
            } else {
                callback([]);
            }
        }
    );
}

module.exports.getUser = function(login, callback) {
    client.query(`
        SELECT * 
          FROM books.users 
         WHERE username = $1
        `, [login], (err, res) => {
            if (err == null) {
                callback(res.rows);
            } else {
                callback(false);
            }
        }
    );
}

module.exports.addCookie = function(cookie, user_id, callback) {
    client.query(`
        DELETE FROM books.cookies 
         WHERE user_id = $1 
        `, [user_id], (err) => {
            if (err == null) {
                client.query(`
                    INSERT INTO books.cookies (id, user_id, cookie) 
                         VALUES (DEFAULT, $1, $2)
                    `, [user_id, cookie], (error, result) => {
                        if (error == null) {
                            callback(null);
                        } else {
                            callback(error);
                        }
                    }
                );
            } else {
                callback(err);
            }
        }
    );
}

module.exports.getBooks = function(callback) {
    client.query(`
        SELECT b.id AS book_id, b.name AS book_name, 
               b.rating, b.rating_number, a.id AS author_id, 
               a.surname AS author_surname, a.name AS author_name 
          FROM books.authors a 
          JOIN books.books_authors ba ON a.id = ba.author_id 
          JOIN books.books b ON ba.book_id = b.id 
         ORDER BY a.surname, a.name, b.name
        `, (err, res) => {
            if (err == null) {
                callback(res.rows);
            } else {
                throw err;
            }
        }
    );
}

module.exports.getPublishings = function(callback) {
    client.query(`
        SELECT name, founded, location 
          FROM books.publishings
        `, (err, res) => {
            if (err == null) {
                callback(res.rows);
            } else {
                throw err;
            }
        }
    );
}

module.exports.getProfile = function(user_id, callback) {
    client.query(`
        SELECT * 
          FROM books.users
         WHERE id = $1
        `, [user_id], (err, res) => {
            if (err == null) {
                callback(null, res.rows[0]);
            } else {
                callback(err);
            }
        }
    );
}

module.exports.addUser = function(user, callback) {
    client.query(`
        INSERT INTO books.users 
             VALUES (DEFAULT, $1, $2, $3, $4, $5)
        `, [user.login, user.password, 
            user.surname, user.name, 
            user.email], 
        (err) => {
            if (err != null) {
                callback(err);
            }
        }
    );
}

module.exports.getBookByID = function(bookId, userId, callback) {
    let book = {
        'info': {}, 
        'ratings': []
    };
    client.query(`
        SELECT b.name as book_name, b.rating, b.rating_number, 
               ba.author_id, a.surname as author_surname, 
               a.name as author_name 
          FROM books.books b  
          JOIN books.books_authors ba ON book_id = b.id 
          JOIN books.authors a ON a.id = ba.author_id 
         WHERE b.id = $1
        `, [bookId], (err, res) => {
            if (err == null) {
                book.info = res.rows[0];
                client.query(`
                    SELECT u.id, u.username, u.name, u.surname, 
                           br.id AS rating_id, 
                           br.rating, br.review, (u.id = $1) AS current_user  
                      FROM books.books_ratings br 
                      JOIN books.users u ON br.user_id = u.id 
                     WHERE book_id = $2 
                     ORDER BY CASE WHEN u.id = $3 THEN 1 ELSE 2 END, u.id
                    `, [userId, bookId, userId], (error, result) => {
                        if (error == null) {
                            book.ratings = result.rows;
                            callback(book);
                        } else {
                            callback(new Error('Rating is not found'));
                        }
                    }
                );
            } else {
                callback(err);
            }
        }
    );
}

module.exports.getAuthorByID = function(id, callback) {
    let author = {
        info: {},
        books: []
    };
    client.query(`
        SELECT surname, name, birth_year, death_year 
          FROM books.authors a 
         WHERE a.id = $1 
        `, [id], (err, res) => {
            if (err == null) {
                author.info = res.rows[0];
                client.query(`
                    SELECT b.id, b.name, b.rating, b.rating_number 
                      FROM books.books b 
                      JOIN books.books_authors ba ON ba.book_id = b.id 
                      JOIN books.authors a ON a.id = ba.author_id 
                     WHERE a.id = $1 
                    `, [id], (error, result) => {
                        if (error == null) {
                            author.books = result.rows;
                            callback(null, author);
                        } else {
                            callback(error);
                        }
                    }
                );
            } else {
                callback(err);
            }
        }
    );
}

module.exports.getUserByID = function(id, callback) {
    let user = {
        info: {},
        shelves: [] 
    };
    client.query(`
        SELECT u.username, u.name, u.surname, 
               (SELECT COUNT(*) 
                  FROM books.shelves s 
                 WHERE s.user_id = u.id) AS shelves_number, 
               (SELECT COUNT(*) 
                  FROM books.books_ratings br 
                 WHERE br.user_id = u.id) AS ratings_number 
          FROM books.users u 
         WHERE u.id = $1 
        `, [id], (err, res) => {
            if (err == null) {
                user.info = res.rows[0];
                client.query(`
                    SELECT s.*, 
                           (SELECT COUNT(*) 
                              FROM books.shelves_books sb 
                             WHERE s.id = sb.shelf_id) AS books_number
                      FROM books.shelves s 
                     WHERE s.user_id = $1 
                       AND s.public
                    `, [id], (error, result) => {
                        if (error == null) {
                            user.shelves = result.rows;
                            callback(null, user);
                        } else {
                            callback(error);
                        }
                    }
                );
            }
        }
    );
}

module.exports.getBookByName = function(name, callback) {
    client.query(`
        SELECT b.id AS book_id, b.name AS book_name, 
               b.rating, b.rating_number, a.id AS author_id, 
               a.surname AS author_surname, a.name AS author_name 
          FROM books.authors a 
          JOIN books.books_authors ba ON a.id = ba.author_id 
          JOIN books.books b ON ba.book_id = b.id    
         WHERE LOWER(b.name)    LIKE LOWER('%' || $1 || '%') 
            OR LOWER(a.name)    LIKE LOWER('%' || $1 || '%') 
            OR LOWER(a.surname) LIKE LOWER('%' || $1 || '%') 
            OR LOWER(CONCAT(a.name, ' ', a.surname))         
               LIKE LOWER('%' || $1 || '%')                 
            OR LOWER(CONCAT(a.surname, ' ', a.name))         
               LIKE LOWER('%' || $1 || '%')                 
        `, [name], (err, res) => {
            if (err == null) {
                callback(res.rows);
            } else {
                callback(err);
            }
        }
    );
}

module.exports.getAuthorByName = function(name, callback) {
    client.query(`
        SELECT a.id, a.surname, a.name, a.birth_year, a.death_year, 
               COUNT(ba.book_id) AS book_number 
          FROM books.authors a 
          JOIN books.books_authors ba ON a.id = ba.author_id 
         WHERE LOWER(a.name)    LIKE LOWER('%' || $1 || '%') 
            OR LOWER(a.surname) LIKE LOWER('%' || $1 || '%') 
         GROUP BY a.id, a.surname, a.name, a.birth_year, a.death_year 
         ORDER BY a.surname, a.name, a.id 
        `, [name], (err, res) => {
            if (err == null) {
                callback(res.rows);
            } else {
                callback(err);
            }
        }
    );
}

module.exports.deleteRating = function(ratingId, userId, callback) {
    client.query(`
        SELECT TRUE AS valid, book_id 
          FROM books.books_ratings br 
         WHERE br.id = $1 
           AND br.user_id = $2 
        `, [ratingId, userId], (err, res) => {
            let bookId = res.rows[0].book_id;
            if (err != null) {
                callback(0, false);
            } else {
                client.query(`
                    DELETE FROM books.books_ratings br 
                     WHERE br.id = $1
                    `, [ratingId], (error, result) => {
                        if (error == null) {
                            callback(bookId, true);
                        } else {
                            callback(bookId, false);
                        }
                    }
                );
            }
        }
    );
}

module.exports.getShelves = function(userId, callback) {
    client.query(`
        SELECT *, 
               (SELECT COUNT(*) 
                  FROM books.shelves_books sb 
                 WHERE sb.shelf_id = s.id) AS book_number 
          FROM books.shelves s  
         WHERE s.user_id = $1; 
        `, [userId], (err, res) => {
            if (err == null) {
                callback(null, res.rows);
            } else {
                callback(err);
            }
        }
    );
}

module.exports.editRating = function(ratingId, rating, review, callback) {
    client.query(`
        UPDATE books.books_ratings 
           SET rating = $1, 
               review = $2  
         WHERE id = $3 
        `, [rating, review, ratingId], (err, res) => {
            client.query(`
                SELECT book_id 
                  FROM books.books_ratings 
                 WHERE id = $1
                `, [ratingId], (error, result) => {
                    if (!err) {
                        callback(result.rows[0].book_id, true);
                    } else {
                        if (error == null) {
                            callback(result.rows[0].book_id, false);
                        } else {
                            callback(0, false);
                        }
                    }
                }
            );            
        }
    );
}

module.exports.addRating = function(bookId, userId, rating, review, callback) {
    client.query(`
        INSERT INTO books.books_ratings (id, book_id, user_id, rating, review)
             VALUES (DEFAULT, $1, $2, $3, $4) 
        `, [bookId, userId, rating, review], (err, res) => {
            if (err == null) {
                callback(true);
            } else {
                callback(err);
            }
        }
    );
}

module.exports.addShelf = function(userId, shelfName, shelfDesc, shelfType, callback) {
    client.query(`
        INSERT INTO books.shelves (id, user_id, name, public, description) 
             VALUES (DEFAULT, $1, $2, $3, $4) 
        `, [userId, shelfName, shelfType, shelfDesc], (err) => {
            if (err == null) {
                callback(true);
            } else {
                callback(err);
            }
        }
    );
}

module.exports.getShelf = function(userId, shelfId, callback) {
    client.query(`
        SELECT s.name AS shelf_name, s.description, sb.id AS book_shelf_id, sb.book_id,
               b.name AS book_name, a.name AS author_name, 
               a.surname AS author_surname, a.id AS author_id, 
               (s.user_id = $2) AS current_user 
          FROM books.shelves s 
          LEFT JOIN books.shelves_books sb 
                 ON s.id = sb.shelf_id
          LEFT JOIN books.books b 
                 ON sb.book_id = b.id 
          LEFT JOIN books.books_authors ba  
                 ON b.id = ba.book_id 
          LEFT JOIN books.authors a 
                 ON ba.author_id = a.id 
         WHERE s.id = $1 
         ORDER BY book_id 
        `, [shelfId, userId], (err, res) => {
            if (err == null) {
                callback(null, res.rows);
            } else {
                callback(err);
            }
        }
    );
}

module.exports.addBookToShelf = function(userId, bookId, shelfName, callback) {
    client.query(`
        INSERT INTO books.shelves_books (shelf_id, book_id) 
             SELECT id, $2 AS book_id FROM books.shelves s 
              WHERE user_id = $1 AND name = $3 
                AND NOT EXISTS (SELECT * 
                                  FROM books.shelves_books sb 
                                 WHERE sb.book_id = $2 
                                   AND sb.shelf_id = s.id) 
        `, [userId, bookId, shelfName], (err) => {
            if (err == null) {
                callback(null, true);
            } else {
                callback(err);
            }
        }
    );
}

module.exports.getUsers = function(callback) {
    client.query(`
        SELECT * 
          FROM books.users 
        `, (err, res) => {
            if (err == null) {
                callback(null, res.rows);
            } else {
                callback(err);
            }
        }
    );
}

module.exports.getUsersByName = function(name, callback) {
    client.query(`
        SELECT * 
          FROM books.users 
         WHERE LOWER(name)     LIKE LOWER('%' || $1 || '%') 
            OR LOWER(surname)  LIKE LOWER('%' || $1 || '%') 
            OR LOWER(username) LIKE LOWER('%' || $1 || '%') 
            OR LOWER(CONCAT(name, ' ', surname)) 
            LIKE LOWER('%' || $1 || '%') 
              OR LOWER(CONCAT(surname, ' ', name)) 
            LIKE LOWER('%' || $1 || '%') 
        `, [name], (err, res) => {
            if (err == null) {
                callback(null, res.rows);
            } else {
                callback(err);
            }
        }
    );
}

module.exports.deleteBookShelf = function(userId, bookShelfId, callback) {
    client.query(`
        SELECT shelf_id, (s.user_id = $2) AS current_user 
          FROM books.shelves_books sb 
          JOIN books.shelves s ON sb.shelf_id = s.id 
         WHERE sb.id = $1  
        `, [bookShelfId, userId], (err, res) => {
            if (res.rows.length != 0) {
                let shelfId = res.rows[0].shelf_id; 
                if (err == null) {
                    if (res.rows[0].current_user) {
                        client.query(`
                            DELETE FROM books.shelves_books 
                             WHERE id = $1 
                            `, [bookShelfId], (error) => {
                                if (error == null) {
                                    callback(null, shelfId, true);
                                } else {
                                    callback(error);
                                }
                            }
                        );
                    } else {
                        callback(null, shelfId, false);
                    }
                } else {
                    callback(err);
                }
            } else {
                callback(err);
            }
        }
    );   
}

module.exports.getShelfByName = function(userId, shelfName, callback) {
    client.query(`
        SELECT * 
          FROM books.shelves
         WHERE user_id = $1
           AND LOWER(name) LIKE LOWER('%' || $2 || '%')
            OR LOWER(description) LIKE LOWER('%' || $2 || '%')
        `, [userId, shelfName], (err, res) => {
            if (err == null) {
                callback(null, res.rows);
            } else {
                callback(err);
            }
    })
}
