module.exports = {
  "development": {
    "username": "postgres",
    "password": process.env.POSTGRES_PASSWORD,
    "database": "postgres",
    "host": process.env.DOCKS_DB_ADDRESS,
    "dialect": "postgres"
  },
  "test": {
    "username": "postgres",
    "password": process.env.POSTGRES_PASSWORD,
    "database": "postgres",
    "host": process.env.DOCKS_DB_ADDRESS,
    "dialect": "postgres"
  },
  "production": {
    "username": "postgres",
    "password": process.env.POSTGRES_PASSWORD,
    "database": "postgres",
    "host": process.env.DOCKS_DB_ADDRESS,
    "dialect": "postgres"
  }
}
