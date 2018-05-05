/**
 * Provides functions for managing users in the given database
 */
const Sequelize = require('sequelize');

class User {
    /**
     *
     * @param {Sequelize} db
     */
    constructor(db) {
        this.db = db;
        this.ready = false;

        // TODO(egeldenhuys): Move do dedicated models file/dir?
        this.userModel = this.db.define('User', {
            username: {
                type: Sequelize.STRING
            },
            password: {
                type: Sequelize.STRING
            },
        });

        // TODO(egeldenhuys): How will we know when the database is ready?
        this.initDatabase();
    }

    getDatabase() {
        return this.db;
    }

    getDatabaseState() {
        return this.ready;
    }

    initDatabase() {
        // Using ready state for testing
        let prom = this.userModel.sync({force: false});
        prom.then(() => {
            this.ready = true;
        });

        return prom;
    }

    waitUntilReady() {
        
    }

    createUser(username, password) {
        if (this.ready) {
            return this.userModel.create({
                username: username,
                password: password,
            });
        } else {
           throw String('Database not ready?');
        }
    }

    /**
     * Test function, could not figure out how to make sync.
     * @return {Promise}
     */
    testConnection() {
        return this.db.authenticate();
    }
}

module.exports = User;
