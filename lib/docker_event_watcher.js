const request = require('request');


/**
 * lel
 */
class DockerEventWatcher {
  /**
   * cat
   */
  start() {

    // // parser.js
    // let Transform = require('stream').Transform;

    // let parser = new Transform();
    // parser._transform = function(data, encoding, done) {
    //   console.log('HEY MAH, LOOK WHAT I FOUND: ');
    //   console.log(data);
    //   this.push(data);
    //   done();
    // };

    // console.log("OK?");
    // const requestOptions = {
    //   baseUrl: 'http://unix:/var/run/docker.sock:',
    //   url: '/events',
    //   method: 'GET',
    //   headers: {
    //     // Docker API expects a host header to be present.
    //     'Host': '',
    //   },
    // };

    // request(requestOptions).pipe(parser);

    console.log('Starting sniffing on da socket');

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

      /*
      curl -X POST -H 'Content-type: application/json' --data '{"text":"Hello, World!"}' 
      */

      if (jsonBlob.hasOwnProperty('status')) {
        if (jsonBlob.status == 'die') {
          if (jsonBlob.hasOwnProperty('Actor')) {
            console.log('Container ' + jsonBlob.Actor.Attributes.name + ' has died. QUICK ADMIN! FIX!');
            try {
              request({
                method: 'POST',
                url: '<INCOMING WEB HOOK HERE>',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  'text': 'Container ' + jsonBlob.Actor.Attributes.name + ' has died! Quick Admin, fix it!',
                }),
              }).on('error', (err) => {
                console.error(err);
              }).on('response', (response) => {
                console.log(response.statusCode);
              });
            } catch (err) {
              console.error(err);
            }
          }
        }
      }

      console.log(jsonBlob);
    },
    (err) => {
      console.error(err);
    });
  }
}

module.exports = DockerEventWatcher;
