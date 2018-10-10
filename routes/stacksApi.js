const express = require('express');
const router = new express.Router();
const util = require('util');
const os = require('os');
const axios = require('axios');

const {unlink, writeFile} = require('fs');
const writeFileAsync = util.promisify(writeFile);

const {execFile} = require('child_process');
const execFileAsync = util.promisify(execFile);

/* Api endpoint to build and run a docker-compose file */

// Timeout in milliseconds for CLI calls to docker
const DOCKER_CLI_TIMEOUT = 15000;

// Get all stacks running in the Swarm
router.get('/', async (req, res, next) => {
  const stackList = await retrieveStackList();
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
  if (await doesStackExistInSwarm(req.body.stackName)) {
    res.status(409).send('Stack name already exists');
    return;
  }

  // Deploy stack
  try {
    const stdout = await dockerCLIDeployStack(
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
  if (!await doesStackExistInSwarm(req.params.stackName)) {
    res.status(404).send('Could not find stack with name ' +
     req.body.stackName + '.');
    return;
  }

  // Update stack
  try {
    const stdout = await dockerCLIDeployStack(
      req.params.stackName, req.body.stackFile);
    res.status(200).send(stdout);
  } catch (err) {
    res.status(500).send(err);
  }
});

// Remove stack from swarm
router.delete('/:stackName', async (req, res) => {
  // If the stack doesn't exist, throw 404 response
  if (!await doesStackExistInSwarm(req.params.stackName)) {
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
  if (!await doesStackExistInSwarm(req.params.stackName)) {
    res.status(404).send('Stack with name ' + req.params.stackName
      + ' doesn\'t exist');
    return;
  }

  // List of all the services in the stack
  let serviceIDList = [];
  try {
    serviceIDList = await getServicesByStack(req.params.stackName);
  } catch (error) {
    console.error('Error while fetching services from stack: ' + error);
    res.status(500).send(error);
    return;
  }

  // For every ID, fetch its details from the Docker api
  let inspectPromises = [];
  for (let id of serviceIDList) {
    inspectPromises.push(inspectServiceAxios(id));
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

// Returns the Base64 encoded docker-compose file generated from the
// current Docker Swarm state
router.get('/:stackName/stackfile', async (req, res) => {
  // Ensure the stackname is valid and exists
  if (!await doesStackExistInSwarm(req.params.stackName)) {
    res.status(404).send('Stack with name ' + req.params.stackName
      + ' doesn\'t exist');
    return;
  }

  // Get a list of IDs for the services in the stack
  let serviceIDList = [];
  try {
    serviceIDList = await getServicesByStack(req.params.stackName);
  } catch (error) {
    console.error('Error while fetching services from stack: ' + error);
    res.status(500).send(error);
    return;
  }

  // Return response (UNIMPLEMENTED)
  res.status(501).send(serviceIDList);
});

// List all the tasks in the stack
router.get('/:taskName/tasks', async (req, res) => {
  // Ensure the taskname is valid and exists
  if (!await doesStackExistInSwarm(req.params.taskName)) {
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
      inspectPromises.push(inspectTaskAxios(id));
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
async function retrieveStackList() {
  let stackList = [];

  let cliResponse = {};

  try {
    cliResponse = await execFileAsync(
      'docker', ['stack', 'ls'], {timeout: DOCKER_CLI_TIMEOUT});
  } catch (error) {
    console.error('Error while spawning docker: ' + error + '. '
      + cliResponse.error + '( is docker installed?)');
    return stackList;
  }

  if (cliResponse.error) {
    console.log('Error fetching docker stacks: ' + cliResponse.error);
    return stackList;
  }

  // Parse output
  const outputLines = cliResponse.stdout.split(os.EOL);

  // Skip first line (header)
  for (let i = 1; i < outputLines.length; i++) {
    const nameCountSplit = outputLines[i].match(/\S+/g) || [];
    if (nameCountSplit.length !== 3) {
      continue;
    }

    // Push new @StackListObject
    stackList.push({
      stackName: nameCountSplit[0],
      servicesCount: parseInt(nameCountSplit[1]),
    });
  }

  return stackList;
}

/**
 * Test if a certain stack exists in the swarm
 * @param {String} stackName - Name of stack to test for
 * @return {Promise<boolean>} - Does the stack exist?
 */
async function doesStackExistInSwarm(stackName) {
  let foundStackName = false;
  const stackList = await retrieveStackList();
  for (let i = 0; i < stackList.length; i++) {
    if (stackList[i].stackName === stackName) {
      foundStackName = true;
      break;
    }
  }
  return foundStackName;
}

/**
 * Deploy a stack-file on the swarm using the Docker CLI
 * @param {String} stackName - Name of the stack to create / update
 * @param {String} stackFileBase64 - Base64 encoded compose file
 * @return {Promise<String>} - On success, returns stdout from CLI call
 *
 * @throws {String} Error while trying to deploy stack;
 * std-error will be returned.
 */
async function dockerCLIDeployStack(stackName, stackFileBase64) {
  // TODO: Preemptively prevent stack deployment if stack name is invalid

  // Base64 decode stack file
  const stackFileBuffer = Buffer.from(stackFileBase64, 'base64');

  // Generate temporary file name
  const tempFilePath = util.format('/tmp/%d-%d.yml', Date.now(),
    Math.floor( Math.random() * 100) );

  // Write stack to temporary file
  const writeError = await writeFileAsync(tempFilePath, stackFileBuffer);
  if (writeError) {
    console.log('Error while writing stack to disk: ' + writeError);
    throw writeError;
  }

  // Call docker CLI to deploy stack
  let response = '';
  try {
    let {stdout} = await execFileAsync('docker',
      ['stack', 'deploy', '-c', tempFilePath, stackName],
      {timeout: DOCKER_CLI_TIMEOUT});

    response = stdout;
  } catch (error) {
    if (error) {
      console.log('Error deploying docker stack: ' + error);
      let errorResponse = error.stdout;
      errorResponse += error.stderr;
      throw errorResponse;
    }
  } finally {
    // Remove temporary file after the CLI call ends
    unlink(tempFilePath, (err) => {
      if (err) {
        console.log('Error while removing temporary file ' +
          tempFilePath + ': ' + err);
      }
    });
  }

  return response;
}

/**
 * Given the ID of a service, this helper function will fetch the service
 * details from the Docker API (/services/{id})
 * @param {string} serviceID - ID of the service
 * @return {Promise<Object>} - Returns the Axios response
 *
 * @throws {Object} Any errors returned from the Docker API
 */
async function inspectServiceAxios(serviceID) {
  try {
    return await axios.get('/services/' + serviceID, {
      socketPath: '/var/run/docker.sock',
      timeout: DOCKER_CLI_TIMEOUT,
      headers: {
        'Host': '',
      },
    });
  } catch (error) {
    console.error('Error while fetching service details: ' + error);
    throw error;
  }
}

/**
 * Given the ID of a task, this helper function will fetch the task
 * details from the Docker API (/tasks/{id})
 * @param {string} taskID - ID of the service
 * @return {Promise<Object>} - Returns the Axios response
 *
 * @throws {Object} Any errors returned from the Docker API
 */
async function inspectTaskAxios(taskID) {
  try {
    return await axios.get('/tasks/' + taskID, {
      socketPath: '/var/run/docker.sock',
      timeout: DOCKER_CLI_TIMEOUT,
      headers: {
        'Host': '',
      },
    });
  } catch (error) {
    console.error('Error while fetching task details: ' + error);
    throw error;
  }
}

/**
 * Given the ID of a stack, this helper function will fetch the service
 * IDs of all the services inside the stack
 * @param {string} stackName - Name of the stack
 * @return {Promise<string[]>} - Returns the list of IDs
 * of all services in the stack
 *
 * @throws {Object} Any errors returned from the Docker CLI
 */
async function getServicesByStack(stackName) {
  // Get a list of IDs for the services in the stack
  let servicesCliResponse = {};
  try {
    servicesCliResponse = await execFileAsync(
      'docker', ['stack', 'services', stackName,
        '--format', '{{.ID}}'],
      {timeout: DOCKER_CLI_TIMEOUT});
  } catch (error) {
    console.error('getServicesByStack ERROR:' + error);
    throw error;
  }

  // Split response
  const splitList = servicesCliResponse.stdout.split(os.EOL);

  // Only return IDs with length longer than 0 to filter out ""
  return splitList.filter((id) => id.length > 0);
}

module.exports = router;
