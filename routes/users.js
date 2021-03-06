let express = require('express');
let router = new express.Router();
const UserManager = require('../lib/user_manager');
const db = require('../lib/db');

const userManager = new UserManager(db);

/**
 * GET list of users
 */
router.get('/', function(req, res, next) {
  userManager
    .getAllUsers()
    .then((users) => {
      let result = [];

      for (let i = 0; i < users.length; i++) {
        if ('username' in users[i]) {
          result.push({
            username: users[i].username,
            twofactorenabled: users[i].twofactorenabled,
            twofactorconfirmed: users[i].twofactorconfirmed,
          });
        }
      }

      res.status(200).send({data: result});
    })
    .catch((err) => {
      res.status(500).send(err);
    });
});

/**
 * Create new user
 */
router.post('/', function(req, res, next) {
  userManager
    .getUserByUsername(req.body.username)
    .then((user) => {
      if (user === null) {
        userManager
          .createUser(req.body.username, req.body.password)
          .then((newUser) => {
            console.log('Created user "' + newUser.username + '"');
            res.status(200).send();
          })
          .catch((err) => {
            console.err(err);
            res.status(500).send();
          });
      } else {
        console.log('Username "' + user.username + '" already exists');
        res.status(409).send();
      }
    })
    .catch((err) => {
      console.err(err);
      res.status(500).send();
    });
});

/**
 * UPDATE user 2FA status
 */
router.put('/:username/2fa', function(req, res, next) {
  userManager
    .updateTwoFactorStatus(req.params.username, req.body.status)
    .then((result) => {
      if (result === true) {
        res.status(200).send();
      } else {
        res.status(404).send();
      }
    })
    .catch((err) => {
      console.err(err);
      res.status(500).send();
    });
});

/**
 * GET user 2FA status
 */
router.get('/:username/2fa', function(req, res, next) {
  userManager
    .getUserByUsername()
    .then((user) => {
      let result = {};
      if (user !== null) {
        result.status = user.twofactorenabled;
      }
      res.status(200).send({data: result});
    })
    .catch((err) => {
      res.status(500).send(err);
    });
});

/**
 * Update user
 */
router.put('/:username', function(req, res, next) {
  // TODO(egeldenhuys): Check if user exists before more complicated updates

  if ('password' in req.body) {
    userManager
      .changePassword(req.params.username, req.body.password)
      .then((result) => {
        if (result === true) {
          res.status(200).send();
        } else {
          res.status(404).send();
        }
      })
      .catch((err) => {
        console.err(err);
        res.status(500).send();
      });
  }
});

/**
 * DELETE user
 */
router.delete('/:username', function(req, res, next) {
  userManager
    .removeUser(req.params.username)
    .then((result) => {
      if (result === true) {
        res.status(200).send();
      } else {
        res.status(404).send();
      }
    })
    .catch((err) => {
      console.err(err);
      res.status(500).send();
    });
});

module.exports = router;
