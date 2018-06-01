#!/bin/sh

sudo docker-compose -f docker-compose.yml -f docker-compose.local.yml up --force-recreate --build -d

./wait-for-docks.sh "http://127.0.0.1:8080"

npm run-script jest
return=$?

sudo docker-compose down -v

exit $return