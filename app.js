let express = require('express');
let path = require('path');
let logger = require('morgan');
let cookieParser = require('cookie-parser');
let bodyParser = require('body-parser');

let index = require('./routes/index');
let users = require('./routes/users');
let dockerProxyRouter = require('./routes/docker');
let auth = require('./routes/auth');
let jwtMiddleware = require('./jwt');

let app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// Extract secret key for JWT signing from environmental variable JWT_SECRET
const JWT_SECRET = process.env["JWT_SECRET"];
if (JWT_SECRET === undefined || JWT_SECRET === "") {
    console.warn("Warning: JWT secret not set! Change JWT_SECRET to the required JWT secret value.");
}

// uncomment after placing your favicon in /public
// app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// All routes must be authorized except the /api/auth/token route
app.use(jwtMiddleware(JWT_SECRET).unless({path: ['/api/auth/token']}));

app.use('/', index);
app.use('/users', users);
app.use(['/docker', '/docker/*'], dockerProxyRouter);
app.use('/api/auth', auth);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    let err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handler
app.use(function (err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});

module.exports = app;
