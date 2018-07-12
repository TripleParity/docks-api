const express = require('express');
const router = new express.Router();

// const fs = require('fs');

/* Api endpoint to build and run a docker-compose file */
router.all('/create', function(req, res, next) {
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

  const {exec} = require('child_process');
  exec('docker-compose -f /app/demo-docker-compose.yml up --build', (err, stdout, stderr) => {
    if (err) {
      // node couldn't execute the command
      console.log('Error: ' + err);
      return;
    }

    // the *entire* stdout and stderr (buffered)
    console.log(`stdout: ${stdout}`);
    console.log(`stderr: ${stderr}`);
  });
});

module.exports = router;
