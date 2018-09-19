const express = require('express');
let router = new express.Router();
let dockerEventWatcher = require('../lib/docker_event_watcher');
let dw = require('../lib/docker_webhook');

router.post('/create', async (req, res, next) => {
    if (!req.body.hasOwnProperty('url') || req.body['url'] === '') {
        res.status(400).send('Required parameter url missing');
        return;
      }
    
    if (!req.body.hasOwnProperty('types') || req.body['types'] === '') {
        res.status(400).send('Required parameter types missing');
        return;
    }


    let wh = new dw(req.body['url'], req.body['types'], dockerEventWatcher);
    wh.init();

    res.status(200).send('Webhook created');
});

module.exports = router;