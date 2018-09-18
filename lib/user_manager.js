const Sequelize = require('sequelize');
const Promise = require('promise');
const bcrypt = require('bcrypt');

/**
 * Provides functions for managing users in the given database.
 *
 * Based on the flip of a coin, this module will be async.
 * You can synchronize outside this module if required.
 */
class UserManager {
  /**
   * Create a new UserManager object
   * @param {Sequelize} db
   */
  constructor(db) {
    this.db = db;
    this.ready = false;

    // TODO(egeldenhuys): Move to dedicated models file/dir?
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
      twofactor: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      twofactortoken: {
        type: Sequelize.STRING,
        defaultValue: null,
      }
    });
  }

  /**
   * Returns the state of the database initialization.
   *
   * If not true, the database operations MAY fail
   *
   * @return {boolean}
   */
  getDatabaseState() {
    return this.ready;
  }

  /**
   * Initialize the User table and create default admin
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
   * Return an array of all users in the database.
   * TODO(egeldenhuys): Use pages/offsets/ranges
   * @return {Promise<Array<User>>}
   */
  getAllUsers() {
    return new Promise((resolve, reject) => {
      this.User.findAll()
        .then((users) => {
          resolve(users);
        })
        .catch((err) => {
          reject(err);
        });
    });
  }

  /**
   * Find a user in the database given their PK id
   * @param {number} id
   * @return {Promise<User>}
   */
  getUserById(id) {
    return this.User.findById(id);
  }

  /**
   * Finds a user in the database given the username
   * Returns null if the user does not exist
   * @param {string} username
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
   * @param {string} username
   * @param {string} password
   * @return {Promise<boolean>}
   */
  verifyCredentials(username, password) {
    return new Promise((resolve, reject) => {
      this.getUserByUsername(username)
        .then((user) => {
          if (user != null) {
            bcrypt.compare(password, user.hash).then((res) => {
              resolve(res);
            });
          } else {
            resolve(false);
          }
        })
        .catch((err) => {
          reject(err);
        });
    });
  }

  /**
   * Create a new user and add it to the database.
   * If the username already exist, the old user is returned
   * @param {string} username
   * @param {string} password
   * @return {Promise<User>}
   */
  createUser(username, password) {
    const saltRounds = 10;

    return new Promise((resolve, reject) => {
      this.getUserByUsername(username)
        .then((possibleUser) => {
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
            resolve(possibleUser);
          }
        })
        .catch((err) => {
          reject(err);
        });
    });
  }

  /**
   * Change the password hash for the given username
   *
   * Returns true if the user exists and the password was changed.
   * Returns false if the user does not exist
   * @param {string} username
   * @param {string} password
   * @return {Promise<boolean>}
   */
  changePassword(username, password) {
    const saltRounds = 10;

    return new Promise((resolve, reject) => {
      this.getUserByUsername(username)
        .then((user) => {
          if (user !== null) {
            bcrypt.hash(password, saltRounds).then((hash) => {
              user.hash = hash;
              user.save().then(() => {
                resolve(true);
              });
            });
          } else {
            resolve(false);
          }
        })
        .catch((err) => {
          reject(err);
        });
    });
  }

  /**
   * Remove a User from the database
   * @param {string} username
   * @return {Promise<boolean>} true if we could delete, otherwise false
   */
  removeUser(username) {
    return new Promise((resolve, reject) => {
      this.getUserByUsername(username)
        .then((userToDelete) => {
          if (userToDelete != null) {
            this.User.destroy({where: {username: username}}).then(
              (rows) => {
                if (rows > 0) {
                  resolve(true);
                } else {
                  resolve(false);
                }
              }
            );
          } else {
            resolve(false);
          }
        })
        .catch((err) => {
          reject(err);
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
