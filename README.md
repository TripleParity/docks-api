# Docks API

Docks API provides a layer of Authentication over the Docker API.

The API specification is defined in `docks.apib`

## Features
- [X] Authentication
    - [X] Create, Read, Update and Delete admin users
- [ ] Authorization
    - [ ] Restrict API access based on user permissions
- [ ] Teams
    - [ ] Add users to teams
    - [ ] Assign resources to teams to manage

## Requirements
- Docker Engine version 17 or higher
- Docker Swarm Manager Node for running Docks API

## Configuration

By default Docks API listens on `*:8080`. This can be configured in `docker-compose.yml`

### Environment Variables
Docks API can be configured using the following environment variables:
- `JWT_SECRET` - Secret key used to sign JavaScript Web Tokens.
    - Default: `changeme`
- `DOCKS_DB_ADDRESS` - Hostname for connecting to the database.
    - Default: `db`
- `POSTGRES_PASSWORD` - Password for authenticating with the database as the user `postgres`
    - Default: `example`


## Deployment
The latest version of Docks API can be deployed as follows
```shell
git clone https://github.com/TripleParity/docks-ui

sudo docker swarm init
sudo docker stack deploy -c docker-compose.yml docks-api
```

## Development
### Using Node.js and Docker

Please see the security implications of [managing Docker as a non-root user](https://docs.docker.com/install/linux/linux-postinstall/#manage-docker-as-a-non-root-user)

```shell
# Required to communicate with the Docker socket
# without running npm as root
sudo usermod -aG docker $USER

# Log out and log back in or restart so that your group membership is re-evaluated.

docker swarm init

# Deploy postgres database
docker stack deploy -c docker-compose/db.yml docks-db

# Install required packages and tools
npm install

# Perform migrations on development database
npm run dev-migrate-db

# Run Docks API from source and export env variables
npm run start-dev-db
```

### Using only Docker

If you use the included Docker file for development, there is no need to install NodeJS on your local machine.

The included Development docker-compose file will run the Docks API on port 8080:

`$ docker-compose  -f docker-compose.development.yml up --build`

Note: currently, the development container will set the ownership of the `node_modules` folder and all installed
packages to root if they don't exist (pure Docker workflow). This will break things if you decide to run the project 
locally instead of purely with Docker since the container could have a different Node version.

## Testing
### Unit Tests
Unit tests are defined in the `spec` folder and can be run with:
```shell
npm run test
```

### Integration Testing
By default the integration tests are run against `http://127.0.0.1:8080`
using the command `npm run jest`.

This requires the Docks API server and database to be running.

Docks API can be hosted as described in [Using Node.js and Docker for development](#using-nodejs-and-docker)
or the entire stack can be built and deployed with Docker using `./integration-test.sh`
