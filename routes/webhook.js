const express = require('express');
let router = new express.Router();
let DockerEventWatcher = require('../lib/docker_event_watcher');
let Webhook = require('../lib/docker_webhook');

let dockerEventWatcher = new DockerEventWatcher();
let handler = dockerEventWatcher.dockerEventHandler;
dockerEventWatcher.start();

let Webhooks = dockerEventWatcher.forward_to;

router.post('/', async (req, res, next) => {
  if (!req.body.hasOwnProperty('url') || req.body['url'] === '') {
    res.status(500).send({message: 'Required parameter missing'});
    return;
  }

  if (!req.body.hasOwnProperty('types') || req.body['types'] === '') {
    res.status(500).send({message: 'Required parameter missing'});
    return;
  }

  if (!req.body.hasOwnProperty('name') || req.body['name'] === '') {
    res.status(500).send({message: 'Required parameter missing'});
    return;
  }

  let wh = new Webhook(req.body['name'], req.body['url'],
    req.body['types'], handler);

  if (req.body.hasOwnProperty('slack') || req.body['slack'] === true) {
    wh.modify = (json) => {
      return {text: JSON.stringify(json)};
    };
  }

  if (req.body.hasOwnProperty('modifier')) {
    wh.modify = eval(req.body['modifier']);
  }

  wh.init();

  Webhooks.push(wh);

  res.status(200).send({message: 'Webhook created!'});
});

router.delete('/', async (req, res, next) => {
  let name = req.params.name;

  let j = 0;
  let se = false;

  Webhooks.forEach((webhook) => {
    if (webhook.name === name) {
      Webhooks.splice(j, 1);
      res.status(200).send({message: 'Webhook deleted!'});
      se = true;
    }
    j++;
  });

  if (!se) {
    res.status(400).send({message: 'Webhook not found!'});
  }
});

module.exports = router;
