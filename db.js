const DOCKS_DB_ADDRESS = process.env['DOCKS_DB_ADDRESS'];
if (DOCKS_DB_ADDRESS === undefined || DOCKS_DB_ADDRESS === '') {
    console.warn('Warning: Docks database address not set! Change DOCKS_DB_ADDRESS to the database address');
}

const Sequelize = require('sequelize');

const db = new Sequelize('postgres', 'postgres', 'example', {
    host: DOCKS_DB_ADDRESS,
    dialect: 'postgres',
    operatorsAliases: false,

    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000,
    },
});

module.exports = db;
