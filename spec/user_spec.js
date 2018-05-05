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


    let user = new User(sequelizeSqlite);

    it('should have a connection to the test database', async function() {

        try {
            await user.testConnection();
            expect(true).toBe(true);
        } catch (e) {
            console.error(e);
            expect(false).toBe(true);
        }
    });

    describe('Given an empty database', function() {

        beforeEach(function() {
            const sqlite = new Sequelize('database', null, null, {
                dialect: 'sqlite',
                storage: ':memory:',
            });

            user = new User(sqlite);
        });

        describe('When creating a new User object', function() {
            it('the schema should be created)', async function() {
                //expect(user.getDatabaseState()).toBe(true);

                //await user.initDatabase();
                // TODO(egeldenhuys): Test actual database contents?
                //expect(user.getDatabaseState()).toBe(true);

                let userInstance = await user.createUser('Fred', 'poppers');
                expect(userInstance.username).toBe('Fred');

            });
        });


    });
});
