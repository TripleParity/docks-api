const express = require('express');
const request = require('request');
const router = express.Router();

router.get('/test', function (req, res, next) {
    res.send('Hello!');
});

module.exports = router;
