const express = require('express');
const router = new express.Router();
const fs = require('fs');
const util = require('util');

/* Api endpoint to build and run a docker-compose file */

// Get all stacks running in the Swarm
router.get('/', function(req, res, next) {

});

// Deploy a new stack to the Swarm. The stack name should not exist
router.post('/', function(req, res, next) {
  if (!req.body.hasOwnProperty('stackName') || req.body['stackName'] === '') {
    res.status(400).send('Required parameter stackName missing');
    return;
  }

  if (!req.body.hasOwnProperty('stackFile') || req.body['stackFile'] === '') {
    res.status(400).send('Required parameter stackFile missing');
    return;
  }

  // Debug print information
  console.log(req.body.stackName);
  console.log(req.body.stackFile);

  // Base64 decode stack file
  const stackFileBuffer = Buffer.from(req.body.stackFile, 'base64');

  // Generate temporary file name
  const tempFileName = util.format('/tmp/%d-%d.yml', Date.now(),
    Math.floor( Math.random() * 100) );

  // Write stack to actual temporary file
  fs.writeFile(tempFileName, stackFileBuffer, function(err) {
    if (err) {
      res.status(500).send('Error saving stack file to disk');
      console.log(err);
      return;
    }

    // TODO(devosray): Deploy new stack file?
    res.status(200).send('Saved file to disk');
  });

  // const composeFileContents = req.body['composeFile'];
  // console.log(composeFileContents);
  //
  // if (composeFileContents === "") {
  //     res.status(400);
  //     res.write("Error while parsing compose file.");
  //     return;
  // }
  //
  // fs.writeFile("/tmp/testfile.yml", composeFileContents, function (err) {
  //     if (err) {
  //         res.status(500);
  //         res.write("Error while saving compose file.");
  //         return;
  //     }
  //
  //     res.status(200);
  //     res.write("Compose file saved.");
  // })

  // const {exec} = require('child_process');
  // exec('docker-compose -f /app/demo-docker-compose.yml up --build', (err, stdout, stderr) => {
  //   if (err) {
  //     // node couldn't execute the command
  //     console.log('Error: ' + err);
  //     return;
  //   }
  //
  //   // the *entire* stdout and stderr (buffered)
  //   console.log(`stdout: ${stdout}`);
  //   console.log(`stderr: ${stderr}`);
  // });
});

module.exports = router;
