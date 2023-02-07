const {
	v4: uuidv4
} = require('uuid');
const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const PORT = process.env.PORT || 5000;
const app = express();
const db = require('./db/db');
const e = require('express');

app.use(bodyParser.json());
app.use(express.urlencoded({
	extended: false
}));
app.use(express.json());
app.use(cookieParser());
app.use(express.static(__dirname + '/public'));

app.set('view engine', 'pug');

function sendServerError(res, errorDescription) {
	res.render('message', {
		title: 'Серверная ошибка',
		message: 'Произошла серверная ошибка!',
		description: errorDescription,
		link: '/',
		linkMessage: 'Вернуться на главную страницу'
	});
}

app.get('/', (req, res) => {
	res.sendFile('./html/main.html', {
		root: './'
	});
});

app.get('/login', (req, res) => {
	res.sendFile('./html/login.html', {
		root: './'
	});
});

app.post('/login', (req, res) => {
	db.getUser(req.body.login, (user) => {
		if (user.length > 0) {
			if (user[0].password == req.body.password) {
				let cookie = uuidv4();
				db.addCookie(cookie, user[0].id, (err) => {
					if (err == null) {
						res.cookie('Auth', cookie);
						res.redirect(301, '/books');
					} else {
						sendServerError(res, err.message);
					}
				});
			} else {
				res.render('message', {
					title: 'Ошибка входа',
					message: 'Введены неверные данные',
					link: '/login',
					linkMessage: 'Вернуться на страницу входа'
				});
			}
		} else {
			res.render('message', {
				title: 'Пользователь не зарегистрирован',
				message: 'Пользователь не зарегистрирован',
				link: '/registration',
				linkMessage: 'Перейти на страницу регистрации'
			});
		}
	});
});

app.get('/authors', (req, res) => {
	db.getAuthors((result) => {
		res.render('authors', {
			authors: result
		});
	});
});

app.get('/books', (req, res) => {
	db.getBooks((result) => {
		res.render('books', {
			values: result
		});
	});
});

app.get('/publishings', (req, res) => {
	db.getPublishings((result) => {
		res.render('publishings', {
			values: result
		});
	});
});

app.get('/profile', (req, res) => {
	db.getUserIdByCookie(req.cookies.Auth, (err, userId) => {
		if (err == null) {
			db.getProfile(userId, (error, result) => {
				if (error == null) {
					res.render('profile', {
						user: result
					});
				} else {
					sendServerError(res, error.message);
				}
			});
		} else {
			sendServerError(res, err.message);
		}
	});
});

app.get('/registration', (req, res) => {
	res.sendFile('./html/registration.html', {
		root: './'
	})
});

app.post('/registration', (req, res) => {
	db.addUser(req.body, (err) => {
		if (err == null) {
			res.render('message', {
				title: 'Регистрация завершена',
				message: 'Пользователь зарегистирован',
				link: '/login',
				linkMessage: 'Перейти на страницу авторизации'
			});
		} else {
			res.render('message', {
				title: 'Пользователь не зарегистирован',
				message: 'Произошла ошибка! Пользователь не зарегистирован',
				link: '/registration',
				linkMessage: 'Перейти на страницу регистрации'
			});
		}
	});
});

app.get('/books/:id', (req, res) => {
	db.getUserIdByCookie(req.cookies.Auth, (err, userId) => {
		if (err == null) {
			db.getBookByID(req.params.id, userId, (book) => {
				res.render('book', {
					book: book.info,
					ratings: book.ratings,
					book_id: req.params.id
				});
			});
		} else {
			sendServerError(res, err.message);
		}
	});
});

app.get('/authors/:id', (req, res) => {
	db.getAuthorByID(req.params.id, (err, result) => {
		if (err == null) {
			res.render('author', {
				author: result.info,
				books: result.books
			});
		} else {
			sendServerError(res, err.message);
		}
	});
});

app.get('/shelves/', (req, res) => {
	db.getUserIdByCookie(req.cookies.Auth, (err, userId) => {
		if (userId) {
			db.getShelves(userId, (error, result) => {
				if (error == null) {
					res.render('shelves', {
						shelves: result
					});
				} else {
					sendServerError(res, error.message);
				}
			});
		} else {
			sendServerError(res, err.message);
		}
	});
});


app.get('/shelves/:id', (req, res) => {
	db.getUserIdByCookie(req.cookies.Auth, (err, userId) => {
		if (err == null) {
			db.getShelf(userId, req.params.id, (error, result) => {
				if (error == null) {
					res.render('shelf', {
						books: result,
					});
				} else {
					sendServerError(res, error.message);
				}
			});
		} else {
			sendServerError(res, err.message);
		}
	});
});

app.post('/book_shelf_del/:id', (req, res) => {
	db.getUserIdByCookie(req.cookies.Auth, (err, userId) => {
		if (err == null) {
			db.deleteBookShelf(userId, req.params.id, (error, shelfId, result) => {
				if (error == null) {
					if (result.length != 0) {
						res.render('message', {
							title: 'Удаление книги с полки',
							message: 'Книга была удалена с полки',
							link: '/shelves/' + shelfId,
							linkMessage: 'Вернуться на страницу полки'
						});
					} else {
						sendServerError(res, '');
					}
				} else {
					sendServerError(res, error.message);
				}
			});
		} else {
			sendServerError(res, err.message);
		}
	});
});

app.get('/users/:id', (req, res) => {
	db.getUserByID(req.params.id, (err, result) => {
		if (err == null) {
			res.render('user', {
				info: result.info,
				shelves: result.shelves
			});
		} else {
			sendServerError(res, err.message);
		}
	});
});

app.post('/books', (req, res) => {
	db.getBookByName(req.body.search, (err, result) => {
		if (err == null) {
			res.render('books', {
				values: result
			});
		} else {
			sendServerError(res, err.message);
		}
	});
});

app.post('/authors', (req, res) => {
	db.getAuthorByName(req.body.search, (result) => {
		res.render('authors', {
			authors: result
		});
	});
});

app.get('/users', (req, res) => {
	db.getUsers((err, result) => {
		if (err == null) {
			res.render('users', {
				users: result
			});
		} else {
			sendServerError(res, err.message);
		}
	});
});

app.post('/users', (req, res) => {
	db.getUsersByName(req.body.search, (err, result) => {
		if (err == null) {
			res.render('users', {
				users: result
			});
		} else {
			sendServerError(res, err.message);
		}
	});
});

app.post('/rating_del/:id', (req, res) => {
	db.getUserIdByCookie(req.cookies.Auth, (err, userId) => {
		if (error == null) {
			db.deleteRating(req.params.id, userId, (bookId, result) => {
				if (result) {
					res.render('message', {
						title: 'Удаление отзыва',
						message: 'Отзыв был удалён',
						link: '/books/' + bookId,
						linkMessage: 'Перейти на страницу книги'
					});
				} else {
					res.render('message', {
						title: 'Ошибка удаления',
						message: 'Отзыв не был удалён',
						link: '/books/' + bookId,
						linkMessage: 'Перейти на страницу книги'
					});
				}
			});
		} else {
			sendServerError(res, err.message);
		}
	});
});

app.get('/rating_edit/:id', (req, res) => {
	db.getUserIdByCookie(req.cookies.Auth, (err) => {
		if (err == null) {
			res.render('rating_edit');
		} else {
			sendServerError(res, err.message);
		}
	});
});

app.post('/rating_edit/:id', (req, res) => {
	db.editRating(req.params.id, req.body.rating, req.body.review, (bookId, result) => {
		if (result) {
			res.render('message', {
				title: 'Изменение отзыва',
				message: 'Отзыв был изменён',
				link: '/books/' + bookId,
				linkMessage: 'Перейти на страницу книги'
			});
		} else if (bookId != 0) {
			res.render('message', {
				title: 'Ошибка изменения',
				message: 'Отзыв не был изменён',
				link: '/books/' + bookId,
				linkMessage: 'Перейти на страницу книги'
			});
		} else {
			sendServerError(res, '');
		}
	});
});

app.get('/rating_add/:id', (req, res) => {
	db.getUserIdByCookie(req.cookies.Auth, (err) => {
		if (err == null) {
			res.render('rating_add', {
				book_id: req.params.id
			});
		} else {
			sendServerError(res, err.message);
		}
	});
});

app.post('/rating_add/:id', (req, res) => {
	db.getUserIdByCookie(req.cookies.Auth, (err, userId) => {
		if (err == null) {
			db.addRating(
				req.params.id,
				userId,
				req.body.rating,
				req.body.review, (result) => {
					if (result) {
						res.render('message', {
							title: 'Отзыв добавлен',
							message: 'Отзыв был добавлен',
							link: '/books/' + req.params.id,
							linkMessage: 'Вернуться на страницу книги'
						});
					} else {
						res.render('message', {
							title: 'Ошибка добавления',
							message: 'Отзыв не был добавлен',
							link: '/books/' + req.params.id,
							linkMessage: 'Вернуться на страницу книги'
						});
					}
				});
		} else {
			sendServerError(res, err.message);
		}
	});
});

app.get('/shelf_add', (req, res) => {
	db.getUserIdByCookie(req.cookies.Auth, (err) => {
		if (err == null) {
			res.render('shelf_add');
		} else {
			sendServerError(res, err.message);
		}
	});
});

app.post('/shelf_add', (req, res) => {
	db.getUserIdByCookie(req.cookies.Auth, (err, userId) => {
		if (err == null) {
			let isPublic = req.body.type == 'public' ? true : false;
			db.addShelf(userId, req.body.shelf, req.body.review, isPublic, (result) => {
				if (result) {
					res.render('message', {
						title: 'Полка добавлена',
						message: 'Полка была добавлена',
						link: '/shelves',
						linkMessage: 'Вернуться на страницу полок'
					});
				} else {
					res.render('message', {
						title: 'Ошибка добавления',
						message: 'Полка не была добавлена',
						link: '/shelves',
						linkMessage: 'Вернуться на страницу полок'
					});
				}
			});
		} else {
			sendServerError(res, err.message);
		}
	});
});

app.get('/shelf_add/:bookId', (req, res) => {
	db.getUserIdByCookie(req.cookies.Auth, (err, userId) => {
		if (err == null) {
			db.getShelves(userId, (error, result) => {
				if (error == null) {
					res.render('shelf_add_book', {
						shelves: result,
						bookId: req.params.bookId
					});
				}
			});
		} else {
			sendServerError(res, err.message);
		}
	});
});

app.post('/shelf_add/:bookId', (req, res) => {
	db.getUserIdByCookie(req.cookies.Auth, (err, userId) => {
		if (err == null) {
			db.addBookToShelf(userId, req.params.bookId, req.body.shelf, (error, result) => {
				if (error == null) {
					res.render('message', {
						title: 'Книга добавлена',
						message: 'Книга была добавлена на полку',
						link: '/books',
						linkMessage: 'Вернуться на страницу книг'
					});
				} else {
					res.render('message', {
						title: 'Ошибка добавления',
						message: 'Книга не была добавлена на полку',
						link: '/books',
						linkMessage: 'Вернуться на страницу книг'
					});
				}
			});
		} else {
			sendServerError(res, err.message);
		}
	});
});

app.listen(PORT, () => {
	console.log(`Server running at http://localhost:${PORT}`);
});