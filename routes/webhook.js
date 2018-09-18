const express = require('express');
let router = new express.Router();
let dockerEventWatcher = require('../lib/docker_event_watcher');
let dw = require('../lib/docker_webhook');

router.post('/create', async (req, res, next) => {
    if (!req.body.hasOwnProperty('url') || req.body['url'] === '') {
        res.status(400).send('Required parameter url missing');
        return;
      }
    
    if (!req.body.hasOwnProperty('type') || req.body['type'] === '') {
        res.status(400).send('Required parameter type missing');
        return;
    }

    let webhook = new dw(req.body['url'], req.body['type'], dockerEventWatcher);
    webhook.init();

    res.status(200).send('Webhook created');
});

module.exports = router;