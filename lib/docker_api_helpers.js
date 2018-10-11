const util = require('util');
const os = require('os');
const axios = require('axios');

const {unlink, writeFile} = require('fs');
const writeFileAsync = util.promisify(writeFile);

const {execFile} = require('child_process');
const execFileAsync = util.promisify(execFile);

// Timeout in milliseconds for CLI calls to docker
const DOCKER_CLI_TIMEOUT = 15000;

/**
 * @typedef {object} StackListObject - A single entry in the output when
 * listing active stacks in docker.
 * @property {string} stackName - The unique name for the stack
 * @property {number} servicesCount - The number of services
 * running in the stack
 */

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
 * Given the ID of a stack, this helper function inspects every
 * service in the stack and aggregates the results in an array
 * @param {string} stackName - Name of the stack
 * @return {Promise<string[]>} - All services in the stack
 *
 * @throws {Object} Any errors returned from the Docker API
 */
async function getServicesByStack(stackName) {
  // List of all the services in the stack
  let serviceIDList = [];
  try {
    serviceIDList = await getServiceIDsByStack(stackName);
  } catch (error) {
    console.error('Error while fetching services from stack: ' + error);
    throw error;
  }

  // For every ID, fetch its details from the Docker api
  let inspectPromises = [];
  for (let id of serviceIDList) {
    inspectPromises.push(inspectServiceAxios(id));
  }

  // Wait for all promises to resolve
  let inspectedServices = [];
  for (let promise of inspectPromises) {
    const httpResponse = await promise;
    if (httpResponse.status !== 200) {
      continue;
    }

    inspectedServices.push(httpResponse.data);
  }

  return inspectedServices;
}

/**
   * Given the ID of a network, this helper function will fetch the network
   * details from the Docker API (/network/{id})
   * @param {string} networkID - ID of the network
   * @return {Promise<Object>} - Returns the Axios response
   *
   * @throws {Object} Any errors returned from the Docker API
   */
async function inspectNetworkAxios(networkID) {
  try {
    return await axios.get('/networks/' + networkID, {
      socketPath: '/var/run/docker.sock',
      timeout: DOCKER_CLI_TIMEOUT,
      headers: {
        'Host': '',
      },
    });
  } catch (error) {
    console.error('Error while fetching network details: ' + error);
    throw error;
  }
}


/**
   * Given the ID of a network, this helper function will fetch the volume
   * details from the Docker API (/volumes/{id})
   * @param {string} volumeID - ID of the network
   * @return {Promise<Object>} - Returns the Axios response
   *
   * @throws {Object} Any errors returned from the Docker API
   */
async function inspectVolumeAxios(volumeID) {
  try {
    return await axios.get('/volumes/' + volumeID, {
      socketPath: '/var/run/docker.sock',
      timeout: DOCKER_CLI_TIMEOUT,
      headers: {
        'Host': '',
      },
    });
  } catch (error) {
    console.error('Error while fetching volume details: ' + error);
    throw error;
  }
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
    Math.floor(Math.random() * 100));

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
async function getServiceIDsByStack(stackName) {
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

module.exports = {doesStackExistInSwarm,
  retrieveStackList,
  getServicesByStack,
  inspectNetworkAxios,
  inspectVolumeAxios,
  dockerCLIDeployStack,
  inspectServiceAxios,
  inspectTaskAxios,
  getServiceIDsByStack,
};
