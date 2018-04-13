# Docks

Provides a http proxy to the Docker API at `localhost:8080/docker`. For more information,
view [the Docker API documentation.](https://docs.docker.com/engine/api/v1.37)

An example of interacting with the docks api:
`curl http://localhost:8080/docker/containers/json`

## Deployment
Docks API can be deployed with:
```
$ docker run -d -p 8080:8080 --name docks -v /var/run/docker.sock:/var/run/docker.sock tripleparity/docks
```

To stop the running container:
```
$ docker stop docks
```

## Development
If you use the included Docker file for development, there is no need to install NodeJS on your local machine.

The included Development docker-compose file will run the Docks API on port 8080:

`$ docker-compose up`

If you prefer to run it manually, you can start the API with:
1. `docker build -f Dockerfile-dev -t docks-development .`
2. `docker run -it -v "$(pwd)"/:/app -p 8080:8080 -v /var/run/docker.sock:/var/run/docker.sock docks-development `

When the development image runs (step 2), npm will check for any updates. The Express server will automatically
reload as you edit local files.

Note: currently, the development container will set the ownership of the `node_modules` folder and all installed
packages to root if they don't exist (pure Docker workflow).
