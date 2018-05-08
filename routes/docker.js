const express = require('express');
const request = require('request');
const router = express.Router();

const cors = require('cors');

/* Proxy for docker socket */
router.all('*', cors(), function (req, res, next) {
    const requestOptions = {
        baseUrl: "http://unix:/var/run/docker.sock:",
        url: req.url,
        method: req.method,
        body: JSON.stringify(req.body),
        headers: {
            // Docker API expects a host header to be present.
            'Host': '',

            // Content type needs to be passed along too
            'Content-Type': req.get('Content-Type'),
        }
    };

    request(requestOptions, (error, response, body) => {
        if (error) {
            res.status(500);
            res.write("Error while sending request to docker API: " + error);
            console.error(error);
            return;
        }

        res.status(response.statusCode);

        // Append the headers that the docker API returned
        for (const key in response.headers) {
            if (response.headers.hasOwnProperty(key)) {
                res.append(key, response.headers[key]);
            }
        }

        res.write(body);
        res.end();
    });
});

module.exports = router;
