const express = require('express');
const request = require('request');
const router = new express.Router();

/**
 * Endpoint: /tasks[?...]
 *
 * Resolves NodeID for each task
 */
router.get('/', function(req, res, next) {
  const requestOptions = {
    baseUrl: 'http://unix:/var/run/docker.sock:',
    // Remove leading / to accept args
    url: '/tasks' + req.url.slice(1, req.url.length),
    method: req.method,
    body: JSON.stringify(req.body),
    headers: {
      // Docker API expects a host header to be present.
      'Host': '',

      // Content type needs to be passed along too
      'Content-Type': req.get('Content-Type'),
    },
  };

  console.log(req.url);

  // Forward request to Docker
  request(requestOptions, (error, response, body) => {
    if (error) {
      res.status(500);
      res.write('Error while sending request to docker API: ' + error);
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
    let tasks = JSON.parse(body);

    // Map of NodeID -> NodeHostname
    let nodes = {};

    // Get all unique NodeIDs
    tasks.forEach((task) => {
      if (!nodes.hasOwnProperty(task.NodeID)) {
        nodes[task.NodeID] = '';
      }
    });

    // TODO(egeldenhuys): Get rid of the nested callbacks

    const totalNodes = Object.keys(nodes).length;
    let nodesResolved = 0;

    // Resolve all NodeIDs
    Object.keys(nodes).forEach((nodeID) => {
      // Note: Spawning another thread here...
      request(
        {
          baseUrl: 'http://unix:/var/run/docker.sock:',
          url: '/nodes/' + nodeID,
          method: 'GET',
          headers: {
            // Docker API expects a host header to be present.
            'Host': '',

            // Content type needs to be passed along too
            'Content-Type': req.get('Content-Type'),
          },
        },
        (err2, res2, body2) => {
          if (err2) {
            console.error(err2);
            res.status(500);
            res.write('Error while sending request to docker API: ' + err2);
            return;
          }

          let node = JSON.parse(body2);
          if (
            node.hasOwnProperty('Description') &&
            node.Description.hasOwnProperty('Hostname')
          ) {
            console.log(node.Description.Hostname);
            nodes[nodeID] = node.Description.Hostname;
            nodesResolved += 1;
          }

          if (nodesResolved == totalNodes) {
            // Add NodeHostname attribute to each task with the respective
            // NodeID

            tasks.forEach((task) => {
              task['NodeHostname'] = nodes[task.NodeID];
            });

            res.write(JSON.stringify(tasks));
            res.end();
          }
        } // End request callback
      ); // End request
    }); // End foreach
  }); // End request forward to Docker
}); // End incoming request handler
// End callback hell?

module.exports = router;
