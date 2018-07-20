#!/bin/sh

# Wait for postgresql to be functional
until PGPASSWORD=$POSTGRES_PASSWORD psql -h "$DOCKS_DB_ADDRESS" -U "postgres" -c '\q'; do
  >&2 echo "Postgres is unavailable - sleeping"
  sleep 1
done

# Test if the Docker socket file exists
if test -S "/var/run/docker.sock";
then
    echo "Found Docker socket file.";
else
    echo "Docker socket file not found. Please mount /var/run/docker.sock">&2;
    exit 1;
fi

npm install
DEBUG=docks:* PORT=8080 npm start
