const request = require('request');
const de = require('./docker_event_handler');

/**
 * lel
 */
class DockerEventWatcher {
  /**
   * cat
   */
  start() {
    let dockerEventHandler = new de.DockerEventHandler();

    dockerEventHandler.ServiceObservable.subscribe(json => console.log(json));

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
      console.log("HEUHEUHEU");
      let jsonBlob = JSON.parse(data.toString('utf8'));
      dockerEventHandler.feed(jsonBlob);
    },
    (err) => {
      console.error('err:' + err);
    });
  }
}

module.exports = DockerEventWatcher;
