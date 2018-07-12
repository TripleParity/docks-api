# Docker Compose Files

## Build Docks API and Deploy to Swarm

```
sudo docker service create --name registry -p 5000:5000 registry:2

docker build -t 127.0.0.1:5000/docks-api:local ../
docker push 127.0.0.1:5000/docks-api:local

docker stack deploy -c local.yml docks-api
```