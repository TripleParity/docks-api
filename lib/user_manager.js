const Sequelize = require('sequelize');
const Promise = require('promise');
const bcrypt = require('bcrypt');

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
            hash: {
                type: Sequelize.STRING,
            },
        });
    }

    /**
     * Returns the state of the database initialisation.
     *
     * If not true, the database operations MAY fail
     *
     * @return {boolean}
     */
    getDatabaseState() {
        return this.ready;
    }

    /**
     * Initialise the User table and create default admin
     * @return {Promise<boolean>}
     */
    initDatabase() {
        return new Promise((resolve, reject) => {
            this.User.sync({force: false}).then(() => {
                this.User.findById(1).then((possibleUser) => {
                    if (possibleUser == null) {
                        this.createUser('admin', 'admin').then((newUser) => {
                            if (newUser != null) {
                                this.ready = true;
                                resolve(true);
                            } else {
                                this.ready = false;
                                resolve(false);
                            }
                        });
                    } else {
                        this.ready = true;
                        resolve(true);
                    }
                });
            });
        });
    }

    /**
     * Find a user in the database given their PK id
     * @param id
     * @return {Promise<User>}
     */
    getUserById(id) {
        return this.User.findById(id);
    }

    /**
     *
     * @param username
     * @return {Promise<User>}
     */
    getUserByUsername(username) {
        return this.User.findOne({where: {username: username}});
    }

    /**
     * Check if the username/password pair is valid
     *
     * True if valid, else false
     *
     * @param username
     * @param password
     * @return {Promise<boolean>}
     */
    verifyCredentials(username, password) {
        return new Promise((resolve, reject) => {
            this.getUserByUsername(username).then((user) => {
                if (user != null) {
                    bcrypt.compare(password, user.hash).then((res) => {
                        resolve(res);
                    });
                } else {
                    resolve(false);
                }
            });
        });
    }

    /**
     * Create a new user and add them to the database. Also do hashes
     * @param username
     * @param password
     */
    createUser(username, password) {
        const saltRounds = 10;

        return new Promise((resolve, reject) => {
            this.getUserByUsername(username).then((possibleUser) => {
                if (possibleUser == null) {
                    bcrypt.hash(password, saltRounds).then((hash) => {
                        this.User.create({
                            username: username,
                            hash: hash,
                        }).then((newUser) => {
                            resolve(newUser);
                        });
                    });
                } else {
                    resolve(null);
                }
            });
        });
    }

    /**
     * Change the password hash for the given username
     * @param username
     * @param password
     * @return {Promise<boolean>} True if we could change, otherwise false
     */
    changePassword(username, password) {
        const saltRounds = 10;

        return new Promise((resolve, reject) => {
            this.getUserByUsername(username).then((user) => {
                if (user != null) {
                    bcrypt.hash(password, saltRounds).then((hash) => {
                        user.hash = hash;
                        user.save().then(() => {
                            resolve(true);
                        });
                    });
                } else {
                    resolve(false);
                }
            });
        });
    }

    /**
     * Remove a User from the database
     * @param username
     * @return {Promise<boolean>} true if we could delete, otehrwise false
     */
    removeUser(username) {
        return new Promise((resolve, reject) => {
            this.getUserByUsername(username).then((userToDelete) => {
               if (userToDelete != null) {
                   this.User.destroy({where: {username: username}}).then((rows) => {
                       if (rows > 0) {
                           resolve(true);
                       } else {
                           resolve(false);
                       }
                   });
               } else {
                   resolve(false);
               }
            });
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
