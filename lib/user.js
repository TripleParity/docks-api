/**
 * Provides functions for managing users in the given database
 */
class User {
    /**
     *
     * @param {Sequelize} db
     */
    constructor(db) {
        this.db = db;
    }

    createUser(username, password) {
        return true;
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
