const express = require('express');
let router = new express.Router();
let dockerEventWatcher = require('../lib/docker_event_watcher');
let Webhook = require('../lib/docker_webhook');

let Webhooks = [];

router.post('/', async (req, res, next) => {
    if (!req.body.hasOwnProperty('url') || req.body['url'] === '') {
        res.status(500).send({message: "Required parameter missing"});
        return;
      }
    
    if (!req.body.hasOwnProperty('types') || req.body['types'] === '') {
        res.status(500).send({message: "Required parameter missing"});
        return;
    }

    if (!req.body.hasOwnProperty('name') || req.body['name'] === '') {
        res.status(500).send({message: "Required parameter missing"});
        return;
    }

    let wh = new Webhook(req.body['name'], req.body['url'], req.body['types'], dockerEventWatcher);
    wh.init();

    Webhooks.push(wh);

    res.status(200).send({message: "Webhook created!"});
});

router.delete('/', async (req, res, next) => {

    if (!req.body.hasOwnProperty('name') || req.body['name'] === '') {
        res.status(500).send({message: "Required parameter missing"});
        return;
    }

    let wh = new Webhook(req.body['name'], req.body['url'], req.body['types'], dockerEventWatcher);
    var j = 0;
    var se = false;

    Webhooks.forEach(webhook => {
        if(webhook.name === req.body['name']){
            Webhooks.splice(j, 1);
            res.status(200).send({message: "Webhook deleted!"});
            se = true;
        }
        j++
    });
    if(!se)
        res.status(404).send({message: "Webhook not found!"});
});

module.exports = router;