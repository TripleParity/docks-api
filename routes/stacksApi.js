const express = require('express');
const router = new express.Router();
const fs = require('fs');
const util = require('util');
const {execFile, exec} = require('child_process');

/* Api endpoint to build and run a docker-compose file */

// Timeout in milliseconds for CLI calls to docker
const DOCKER_CLI_TIMEOUT = 5000;

// Get all stacks running in the Swarm
router.get('/', function(req, res, next) {

});

// Deploy a new stack to the Swarm. The stack name should not exist
router.post('/', async function(req, res, next) {
  if (!req.body.hasOwnProperty('stackName') || req.body['stackName'] === '') {
    res.status(400).send('Required parameter stackName missing');
    return;
  }

  if (!req.body.hasOwnProperty('stackFile') || req.body['stackFile'] === '') {
    res.status(400).send('Required parameter stackFile missing');
    return;
  }

  console.log('Preparing to deplay stack with name ' + req.body.stackName);

  // TODO: Preemptively prevent stack deployment if stack name is invalid

  // Check if stack exists. If so, throw error
  const stackList = await retrieveStackList();
  console.log(stackList);

  // Base64 decode stack file
  const stackFileBuffer = Buffer.from(req.body.stackFile, 'base64');

  // Generate temporary file name
  const tempFilePath = util.format('/tmp/%d-%d.yml', Date.now(),
    Math.floor( Math.random() * 100) );

  // Write stack to actual temporary file
  fs.writeFile(tempFilePath, stackFileBuffer, (err) => {
    if (err) {
      res.status(500).send('Error saving stack file to disk');
      console.log(err);
      return;
    }

    // Call docker CLI to deploy stack
    execFile('docker',
      ['stack', 'deploy', '-c', tempFilePath, req.body.stackName],
      {timeout: DOCKER_CLI_TIMEOUT},
      (error, stdout, stderr) => {
        if (error) {
          console.log('Error deploying docker stack: ' + error);
          res.status(500).send(stderr);
        } else {
          res.status(200).send(stdout);
        }

        // Remove temporary file after the CLI call ends
        fs.unlink(tempFilePath, (err) => {
          if (err) {
            console.log('Error while removing temporary file ' +
              tempFilePath + ': ' + err);
          }
        });
      });
  });
});

/**
 * @typedef {object} StackListObject - A single entry in the output when
 * listing active stacks in docker.
 * @property {string} stackName - The unique name for the stack
 * @property {number} servicesCount - The number of services
 * running in the stack
 */

/**
 * Helper function to fetch the current stacks deployed on the swarm
 * @return {Promise<[StackListObject]>}
 */
function retrieveStackList() {
  return new Promise((resolve) => {
    let stackList = [];
    execFile('docker', ['stack', 'ls'],
      {timeout: DOCKER_CLI_TIMEOUT},
      (error, stdout, stderr) => {
        if (error) {
          console.log('Error fetching docker stacks: ' + error);
        } else {
          console.log(stdout);
        }
        resolve(stackList);
      });
  });
}

module.exports = router;
