const request = require('request');
const de = require('./docker_event_handler');
const wh = require('./docker_webhook');

/**
 * lel
 */
class DockerEventWatcher {
  constructor(){
    this.dockerEventHandler = new de.DockerEventHandler();
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
      this.dockerEventHandler.feed(jsonBlob);
    },
    (err) => {
      console.error('err:' + err);
    });
  }
}

dew = new DockerEventWatcher();
dew.start();

module.exports = dew.dockerEventHandler;
