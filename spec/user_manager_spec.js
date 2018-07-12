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
            logging: false,
        });

        userManager = new UserManager(db);
        await userManager.initDatabase();

    });

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
    });

    it('can create new users with an auto incrementing id', async function() {
        let newUser = await userManager.createUser('Fred', 'pass');

        expect(newUser.username).toBe('Fred');

        let user = await userManager.getUserByUsername('Fred');
        expect(user.id).toBe(2);
        expect(user.username).toBe('Fred');

    });

    it('does not create duplicate users', async function() {
        let newUser = await userManager.createUser('Fred', 'pass');
        expect(newUser.username).toBe('Fred')

        let sameUser = await userManager.createUser('Fred', 'car');
        expect(sameUser.username).toBe('Fred');
        expect(sameUser.id).toBe(newUser.id);
    });

    it('works with an existing database', async function() {
        let newUser = await userManager.createUser('Fred', 'pass');

        let anotherManager = new UserManager(db);
        await userManager.initDatabase();

        let user = await userManager.getUserById(2);

        expect(user).not.toBe(null);
        expect(user.id).toBe(2);
        expect(user.username).toBe('Fred');
    });

    it('created an admin user with username/password of admin/admin', async function() {
        expect(await userManager.verifyCredentials('admin', 'admin')).toBe(true);
    });

    it('can authenticate users given username and password', async function() {
        await userManager.createUser('James', 'Bond');
        expect(await userManager.verifyCredentials('James', 'Bond')).toBe(true);
        expect(await userManager.verifyCredentials('James', '123123')).toBe(false);
    });

    it('handles invalid inputs', async function() {
        let user = await userManager.getUserByUsername('does_not_exist');
        expect(user).toBe(null);

        let user2 = await userManager.getUserById(65447474);
        expect(user2).toBe(null);

        let valid = await userManager.verifyCredentials('does_not_exist', 'lel');
        expect(valid).toBe(false);

        let user3 = await userManager.createUser('James', 'rat');
        expect(user3).not.toBe(null);

        let user4 = await userManager.createUser('James', 'rat2');
        expect(user4.id).toBe(user3.id);

        let user5 = await userManager.createUser('admin', 'lol');
        expect(user5).not.toBeNull();
    });

    it('can change User passwords', async function() {
       let user = await userManager.createUser('Bob', 'yeah');
       expect(await userManager.verifyCredentials('Bob', 'yeah')).toBe(true);

       expect(await userManager.changePassword('Bob', 'no')).toBe(true);
       expect(await userManager.verifyCredentials('Bob', 'no')).toBe(true);
       expect(await userManager.verifyCredentials('Bob', 'yeah')).toBe(false);
    });

    it('can delete users', async function() {
        let user = await userManager.createUser('Bob', 'yeah');
        expect(await userManager.getUserByUsername('Bob')).not.toBe(null);

        expect(await userManager.removeUser('Bob')).toBe(true);
        expect(await userManager.getUserByUsername('Bob')).toBe(null);
    });

    it('can return all users in the database', async function() {
        await userManager.createUser('Bob', 'yeah');
        let users = await userManager.getAllUsers();

        // TODO(egeldenhuys): Don't assume order of returned values
        expect(users[0].username).toBe('admin');
        expect(users[0].id).toBe(1);
        expect(users[1].username).toBe('Bob');
        expect(users[1].id).toBe(2);
    });

});
