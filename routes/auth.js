const express = require('express');
const router = new express.Router();
const jwt = require('jsonwebtoken');
const UserManager = require('../lib/user_manager');
const db = require('../db');

const userManager = new UserManager(db);

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

    NOTE: Requires the header Content-Type: application/json
 */
router.post('/token', function(req, res, next) {
    userManager.verifyCredentials(req.body.username, req.body.password).then((valid) => {
            if (valid) {
                const payload = {username: req.body.username};

                let token = jwt.sign(payload, req.JWT_SECRET);

                res.send({
                    jwt: token,
                });
            } else {
                res.status(401).send({error: 'Incorrect username and/or password'});
            }
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send();
        });
});

module.exports = router;
