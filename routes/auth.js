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

module.exports = router;
