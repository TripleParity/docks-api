const express = require('express');
const router = express.Router();

const Sequelize = require('sequelize');

const sequelize = new Sequelize('testDB2', 'null', 'null', {
    dialect: 'sqlite',
    storage: ':memory:',
});


router.get('/test', function(req, res, next) {
    sequelize
        .authenticate()
        .then(() => {
            console.log('Connection has been established successfully.');
            res.send('GOOD');
        })
        .catch(err => {
            console.error('Unable to connect to the database:', err);
            res.send(err);
        });
});

module.exports = router;
