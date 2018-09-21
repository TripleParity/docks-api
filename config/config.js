const Sequelize = require('sequelize');

module.exports = {
  'development': {
    'username': 'postgres',
    'password': process.env.POSTGRES_PASSWORD,
    'database': 'postgres',
    'host': process.env.DOCKS_DB_ADDRESS,
    'dialect': 'postgres',
    'operatorsAliases': Sequelize.Op,
  },
  'test': {
    'username': 'postgres',
    'password': process.env.POSTGRES_PASSWORD,
    'database': 'postgres',
    'host': process.env.DOCKS_DB_ADDRESS,
    'dialect': 'postgres',
    'operatorsAliases': Sequelize.Op,
  },
  'production': {
    'username': 'postgres',
    'password': process.env.POSTGRES_PASSWORD,
    'database': 'postgres',
    'host': process.env.DOCKS_DB_ADDRESS,
    'dialect': 'postgres',
    'operatorsAliases': Sequelize.Op,
  },
};
