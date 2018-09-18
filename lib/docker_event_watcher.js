const request = require('request');
const de = require('./docker_event_handler');
const wh = require('./docker_webhook');

/**
 * lel
 */
class DockerEventWatcher {
  /**
   * cat
   */
  start() {
    let dockerEventHandler = new de.DockerEventHandler();

    // Dummy site used as example; Visible at https://webhook.site/#/6f3622ae-5af7-4a87-9f2d-730b4bc99cf0/d8d6efca-0df5-45c0-ba9f-7f886cc55894/0
    let webhook = new wh('https://webhook.site/6f3622ae-5af7-4a87-9f2d-730b4bc99cf0', [], dockerEventHandler);
    webhook.init();

    const req = request({
      method: 'GET',
      url: 'http://unix:/var/run/docker.sock:/v1.37/events',
      json: true,
      forever: true,
      headers: {
        'Host': '',
      },
    }).on('error', (err) => {
      console.error('Problem with Docker Socket! Retrying...');
      console.error(err);
      setTimeout(this.start, 5000);
    }).on('close', () => {
      console.error('Docker stream closed! Restarting. TODO: Stack overflow?');
      req.destroy();
      this.start();
    }).on('data', (data) => {
      let jsonBlob = JSON.parse(data.toString('utf8'));
      dockerEventHandler.feed(jsonBlob);
    },
    (err) => {
      console.error('err:' + err);
    });
  }
}

module.exports = DockerEventWatcher;
