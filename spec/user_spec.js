/* eslint-disable */

describe("user", function() {
    const User = require('../lib/user.js');

    const Sequelize = require('sequelize');

    const sequelizeSqlite = new Sequelize('database', null, null, {
        dialect: 'sqlite',
        storage: ':memory:',
    });

    // Used for testing if the test works
    const sequelizePostgres = new Sequelize('postgres', 'postgres', 'example', {
        host: 'localhost',
        dialect: 'postgres',
    });


    const user = new User(sequelizeSqlite);

    it('should have a connection to the test database', async function() {

        try {
            await user.testConnection();
            expect(true).toBe(true);
        } catch (e) {
            console.error(e);
            expect(false).toBe(true);
        }

    });
});
