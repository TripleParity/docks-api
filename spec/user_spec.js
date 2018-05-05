/* eslint-disable */

describe('The UserManager', function() {
    const UserManager = require('../lib/user_manager.js');
    const Sequelize = require('sequelize');

    let userManager = null;
    let db = null;

    beforeEach(async function() {
        db = new Sequelize('database', null, null, {
            dialect: 'sqlite',
            storage: ':memory:',
        });

        userManager = new UserManager(db);
        await userManager.initDatabase();

    })

    it('has a connection to the test database', async function() {
        try {
            await userManager.testConnection();
            expect(true).toBe(true);
        } catch (e) {
            console.error(e);
            expect(false).toBe(true);
        }
    });

    it('is initialized with a default admin user', async function() {
        let user = await userManager.getUserById(1);

        expect(user).not.toBe(null);
        expect(user.id).toBe(1);
        expect(user.username).toBe('admin');
        expect(user.password).toBe('admin');
    })

    it('can create new users with an auto incrementing id', async function() {
        let newUser = await userManager.createUser('Fred', 'pass');

        expect(newUser.username).toBe('Fred');
        expect(newUser.password).toBe('pass');

        let user = await userManager.getUserByUsername('Fred');
        expect(user.id).toBe(2);
        expect(user.username).toBe('Fred');
        expect(user.password).toBe('pass');

    });

    it('works with an existing database', async function() {
        let newUser = await userManager.createUser('Fred', 'pass');

        let anotherManager = new UserManager(db);
        await userManager.initDatabase();

        let user = await userManager.getUserById(2);

        expect(user).not.toBe(null);
        expect(user.id).toBe(2);
        expect(user.username).toBe('Fred');
        expect(user.password).toBe('pass');
    })

});
