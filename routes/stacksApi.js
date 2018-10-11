const express = require('express');
const router = new express.Router();
const util = require('util');
const os = require('os');
const compose = require('docker-api-to-compose');

const {execFile} = require('child_process');
const execFileAsync = util.promisify(execFile);

const dockerApi = require('../lib/docker_api_helpers');
const DOCKER_CLI_TIMEOUT = dockerApi.DOCKER_CLI_TIMEOUT;

/* Api endpoint to build and run a docker-compose file */

// Get all stacks running in the Swarm
router.get('/', async (req, res, next) => {
  const stackList = await dockerApi.retrieveStackList();
  res.status(200).send({
    data: stackList,
  });
});

// Deploy a new stack to the Swarm. The stack name should not exist
router.post('/', async function(req, res, next) {
  req.setTimeout(DOCKER_CLI_TIMEOUT);

  if (!req.body.hasOwnProperty('stackName') || req.body['stackName'] === '') {
    res.status(400).send('Required parameter stackName missing');
    return;
  }

  if (!req.body.hasOwnProperty('stackFile') || req.body['stackFile'] === '') {
    res.status(400).send('Required parameter stackFile missing');
    return;
  }

  console.log('Preparing to deploy stack with name ' + req.body.stackName);

  // Check if stack exists. If so, return error
  if (await dockerApi.doesStackExistInSwarm(req.body.stackName)) {
    res.status(409).send('Stack name already exists');
    return;
  }

  // Deploy stack
  try {
    const stdout = await dockerApi.dockerCLIDeployStack(
      req.body.stackName, req.body.stackFile);
    res.status(200).send(stdout);
  } catch (err) {
    res.status(500).send(err);
  }
});

// Update an existing stack on the swarm
router.put('/:stackName', async function(req, res) {
  if (!req.params.hasOwnProperty('stackName')
    || req.params['stackName'] === '') {
    res.status(400).send('Required parameter stackName missing');
    return;
  }

  if (!req.body.hasOwnProperty('stackFile')
    || req.body['stackFile'] === '') {
    res.status(400).send('Required parameter stackFile missing');
    return;
  }

  // Check if stack exists. If not, return error
  if (!await dockerApi.doesStackExistInSwarm(req.params.stackName)) {
    res.status(404).send('Could not find stack with name ' +
      req.body.stackName + '.');
    return;
  }

  // Update stack
  try {
    const stdout = await dockerApi.dockerCLIDeployStack(
      req.params.stackName, req.body.stackFile);
    res.status(200).send(stdout);
  } catch (err) {
    res.status(500).send(err);
  }
});

// Remove stack from swarm
router.delete('/:stackName', async (req, res) => {
  // If the stack doesn't exist, throw 404 response
  if (!await dockerApi.doesStackExistInSwarm(req.params.stackName)) {
    res.status(404).send('Stack with name ' + req.params.stackName
      + ' doesn\'t exist');
    return;
  }

  // Call docker CLI to delete stack
  let cliResponse = {};
  try {
    cliResponse = await execFileAsync(
      'docker', ['stack', 'rm', req.params.stackName],
      {timeout: DOCKER_CLI_TIMEOUT});
  } catch (error) {
    console.error('Error while spawning docker: ' + error + '. '
      + cliResponse.error + ' (is docker installed?)');
    return;
  }

  if (cliResponse.error) {
    console.error('Error while deleting stack: ' + cliResponse.error);
    res.status(500).send(cliResponse.error);
    return;
  }

  res.status(200).send(cliResponse.stdout);
});

// List all the services in the stack
router.get('/:stackName/services', async (req, res) => {
  // Ensure the stackname is valid and exists
  if (!await dockerApi.doesStackExistInSwarm(req.params.stackName)) {
    res.status(404).send('Stack with name ' + req.params.stackName
      + ' doesn\'t exist');
    return;
  }

  try {
    const inspectedServices =
      await dockerApi.getServicesByStack(req.params.stackName);
    res.status(200).send({data: inspectedServices});
  } catch (error) {
    console.err('Error while getting services by stack: ', error);
    res.status(500).send(error);
  }
});

// Returns the Base64 encoded docker-compose file generated from the
// current Docker Swarm state
router.get('/:stackName/stackfile', async (req, res) => {
  // Ensure the stackname is valid and exists
  if (!await dockerApi.doesStackExistInSwarm(req.params.stackName)) {
    res.status(404).send('Stack with name ' + req.params.stackName
      + ' doesn\'t exist');
    return;
  }

  // Get a list of IDs for the services in the stack
  let stackServices = [];
  let stackNetworks = [];
  let stackVolumes = [];
  try {
    stackServices = await dockerApi.getServicesByStack(req.params.stackName);

    // Go through all the networks in the stack and inspect each one
    // TODO: Duplicates?
    const networkIDList = compose.getNetworkIds(stackServices);
    for (let network of networkIDList) {
      const httpResponse = await dockerApi.inspectNetworkAxios(network);
      stackNetworks.push(httpResponse.data);
    }

    // Go through all the volimes in the stack and inspect each one
    // TODO: Duplicates?
    const volumeIDList = compose.getVolumeNames(stackServices);
    for (let volume of volumeIDList) {
      const httpResponse = await dockerApi.inspectVolumeAxios(volume);
      stackVolumes.push(httpResponse.data);
    }

    // Generate stack file
    const stackFile = compose.compose(
      stackServices, stackNetworks, stackVolumes);

    res.status(200).send({
      data: {
        stackFile: new Buffer(stackFile).toString('base64'),
      },
    });
  } catch (error) {
    console.error('Error while attempting to decode stack: ' + error);
    res.status(500).send(error);
    return;
  }
});

// List all the tasks in the stack
router.get('/:taskName/tasks', async (req, res) => {
  // Ensure the taskname is valid and exists
  if (!await dockerApi.doesStackExistInSwarm(req.params.taskName)) {
    res.status(404).send('Stack with name ' + req.params.taskName
      + ' doesn\'t exist');
    return;
  }

  // Get a list of IDs for the tasks in the stack
  let tasksCliResponse = {};
  try {
    tasksCliResponse = await execFileAsync(
      'docker', ['stack', 'ps', req.params.taskName,
        '--format', '{{.ID}}'],
      {timeout: DOCKER_CLI_TIMEOUT});
  } catch (error) {
    console.error('Error while fetching list of tasks: ' + error);
    res.status(500).send(error);
    return;
  }

  // Split response
  const taskIDList = tasksCliResponse.stdout.split(os.EOL);

  // For every ID, fetch its details from the Docker api
  let inspectPromises = [];
  for (let id of taskIDList) {
    if (id.length > 0) {
      inspectPromises.push(dockerApi.inspectTaskAxios(id));
    }
  }

  // Wait for all promises to resolve
  let responseObject = {data: []};
  for (let promise of inspectPromises) {
    const httpResponse = await promise;
    if (httpResponse.status !== 200) {
      continue;
    }

    responseObject.data.push(httpResponse.data);
  }

  // Return response
  res.status(200).send(responseObject);
});

module.exports = router;
