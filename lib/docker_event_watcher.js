const request = require('request');
const de = require('./docker_event_handler');

/**
 * leldirty paws
 */
class DockerEventWatcher {
  /**
   *
   */
  constructor() {
    this.dockerEventHandler = new de.DockerEventHandler();
    this.forward_to = [];
  }

  /**
   * cat
   */
  start() {
    const req = request({
      method: 'GET',
      url: 'http://unix:/var/run/docker.sock:/v1.37/events',
      json: true,
      forever: true,
      headers: {
        Host: '',
      },
    })
      .on('error', (err) => {
        console.error('Problem with Docker Socket! Retrying...');
        console.error(err);
        setTimeout(this.start, 5000);
      })
      .on('close', () => {
        console.error(
          'Docker stream closed! Restarting. TODO: Stack overflow?'
        );
        req.destroy();
        this.start();
      })
      .on(
        'data',
        (data) => {
          let jsonBlob = JSON.parse(data.toString('utf8'));
          this.dockerEventHandler.feed(jsonBlob);

          this.forward_to.forEach((webhook) => {
            request({
              method: 'GET',
              url: webhook.url,
              json: true,
              body: data,
            });
          });
        },
        (err) => {
          console.error('err:' + err);
        }
      );
  }
}

module.exports = DockerEventWatcher;
