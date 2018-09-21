const express = require('express');
const router = new express.Router();
const jwt = require('jsonwebtoken');
const UserManager = require('../lib/user_manager');
const db = require('../lib/db');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');

const userManager = new UserManager(db);

router.get('/test', function(req, res, next) {
  db
    .authenticate()
    .then(() => {
      console.log('Connection has been established successfully.');
      res.send('GOOD');
    })
    .catch((err) => {
      console.error('Unable to connect to the database:', err);
      res.send(err);
    });
});

/*
    Login endpoint. Accepts username and password in the body
    of the request in the format of a JSON object:
    {
        "username": "<username>",
        "password": "<password>",

        // Optional two factor token
        "token": "<optional two factor token>",
    }

    On login success, returns code 200 and embeds the JWT inside a JSON object:
    {
        "jwt": "<jwt>"
    }

    If the user has two-factor enabled and the wrong token is sent,
    a 401/Wrong Token error will be sent.

    If the user has two-factor enabled and NO token is sent, a 400/Token Rquired
    error will be sent.

    If the user has two-factor enabled but has not verified it yet,
    a 402/Initial Token error will be sent.
    The QR code for the token can then be requested from the /qr endpoint.

    On failure, returns code 401

    NOTE: Requires the header Content-Type: application/json
 */
router.post('/token', async function(req, res, next) {
  userManager.verifyCredentials(req.body.username, req.body.password)
    .then(async (valid) => {
      if (valid) {
        let user = await userManager.getUserByUsername(req.body.username);

        // First, test if the user has enabled Two-Factor auth
        if (user.twofactorenabled) {
        // Generate the token if it does not exist
          if (user.twofactortoken == null) {
            user.twofactortoken = speakeasy.generateSecret().base32;
            user.twofactorconfirmed = false;
            await user.save();
          }

          // Try and verify the user-submitted token
          let verified = speakeasy.totp.verify({
            secret: user.twofactortoken,
            encoding: 'base32',
            token: req.body.token,
          });

          // If the submitted token is empty and the user has not confirmed
          // the OTP secret key, show the OTP barcode.
          if (!user.twofactorconfirmed && (req.body.token === ''
                                        || req.body.token === null)) {
            res.status(402).send({
              qr: user.twofactortoken,
            });
            return;
          }

          // If the token is not valid but it has been confirmed, prompt the
          // user for the token.
          if (req.body.token === '' || req.body.token === null) {
            res.status(400).send({
              error: 'Two-Factor token required',
            });
          }

          // If the user has entered the correct 2FA token, let him through
          if (verified) {
            user.twofactorconfirmed = true;
            await user.save();
          } else {
            res.status(401).send({error: 'Incorrect two-factor token'});
            return;
          }
        }

        const payload = {username: req.body.username};

        let token = jwt.sign(payload, req.JWT_SECRET);

        res.send({
          jwt: token,
        });
      } else {
        res.status(401).send({error: 'Incorrect username and/or password'});
      }
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send();
    });
});

/*
    Endpoint to return a QR code of a given user's OTP token.
    Response on success:
    {
        qr: <qr data-url>
    }
*/
router.post('/qr', async function(req, res, next) {
  userManager.verifyCredentials(req.body.username, req.body.password)
    .then(async (valid) => {
      if (valid) {
        let user = await userManager.getUserByUsername(req.body.username);
        let opathUrl = speakeasy.otpauthURL({
          secret: user.twofactortoken,
          label: 'Docks OTP for ' + user.username,
          encoding: 'base32',
        });

        QRCode.toDataURL(opathUrl, (error, dataURL) => {
          res.status(200).send({qr: dataURL});
        });
      } else {
        res.status(401).send({error: 'Incorrect username and/or password'});
      }
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send();
    });
});

module.exports = router;
