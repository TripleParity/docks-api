
const Sequelize = require('sequelize');
const Promise = require('promise');

/**
 * Provides functions for managing users in the given database.
 *
 * Based on the flip of a coin, this module will be asyc.
 * You can synchronise outside this module if required.
 */
class UserManager {
    /**
     * Create a new UserManager object
     * @param {Sequelize} db
     */
    constructor(db) {
        this.db = db;
        this.ready = false;

        // TODO(egeldenhuys): Move do dedicated models file/dir?
        this.User = this.db.define('User', {
            id: {
                type: Sequelize.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            username: {
                type: Sequelize.STRING,
                unique: true,
            },
            password: {
                type: Sequelize.STRING,
            },
        });

    }

    /**
     * Returns the state of the database initialisation.
     *
     * If not true, the database operations MAY fail
     *
     * @returns {boolean}
     */
    getDatabaseState() {
        return this.ready;
    }

    /**
     * Initialize the database with the UserManager table and admin user
     * @returns {Promise}
     */
    initDatabase() {
        return new Promise((resolve, reject) => {
            this.User.sync({force: false}).then(() => {
                this.User.findOrCreate({where: {id: 1}, defaults: {username: 'admin', password: 'admin'}}).then(() => {
                    this.ready = true;
                    resolve(true);
                });
            });
        });
    }

    /**
     * Find a user in the database given their PK id
     * @param id
     * @returns {*}
     */
    getUserById(id) {
        return this.User.findById(id);
    }

    /**
     * Find a user in the database by username
     * @param username
     * @returns {*}
     */
    getUserByUsername(username) {
        return this.User.findOne({where: {username: username}});
    }

    /**
     * Create a new user
     * @param username
     * @param password
     */
    createUser(username, password) {
        return this.User.create({
            username: username,
            password: password,
        });
    }

    /**
     * Test if the UserManager has a connection to the database
     * @return {Promise}
     */
    testConnection() {
        return this.db.authenticate();
    }
}

module.exports = UserManager;
