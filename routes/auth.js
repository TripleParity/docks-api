const express = require('express');
const router = new express.Router();

const Sequelize = require('sequelize');

const db = new Sequelize('postgres', 'postgres', 'example', {
    host: 'db',
    dialect: 'postgres',
    operatorsAliases: false,

    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000,
    },
});

router.get('/test', function(req, res, next) {
    db
        .authenticate()
        .then(() => {
            console.log('Connection has been established successfully.');
            res.send('GOOD');
        })
        .catch((err) => {
            console.error('Unable to connect to the database:', err);
            res.send(err);
        });
});

/*
    Login endpoint. Accepts username and password in the body
    of the request in the format of a JSON object:
    {
        "username": "<username>",
        "password": "<password>"
    }

    On login success, returns code 200 and embeds the JWT inside a JSON object:
    {
        "jwt": "<jwt>"
    }

    On failure, returns code 401
 */
router.post('/token', function(req, res, next) {
    res.send(req.JWT_SECRET);
});

module.exports = router;
