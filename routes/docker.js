var express = require('express');
var router = express.Router();

const http = require('http');
const querystring = require('querystring');

/* Proxy for docker socket */
router.all('*', function(req, res, next) {
    console.log(req.path);
    const dockerSocketOptions = {
        socketPath: '/var/run/docker.sock',
        path: req.url,
        method: req.method
    };

    console.log(dockerSocketOptions);

    // The request sent to the docker daemon
    const clientRequest = http.request(dockerSocketOptions, resp => {
         resp.on('data', data => {
             console.log("got data: " + data);
             res.status(resp.statusCode);
             res.send(JSON.parse(data));
         });
    });

    clientRequest.on('error', err => {
        //todo: better error handling
       res.send("Could not connect to docker.");
       console.error(err);
       res.end();
    });

    clientRequest.write(JSON.stringify(req.body));
    clientRequest.end();
});

module.exports = router;
