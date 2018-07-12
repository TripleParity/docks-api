/*
 * Simple helper module to build the JWT token used throughout the application
 */

const jwt = require('express-jwt');

// Function to build the JWT middleware
const jwtMiddleware = function(secret, unlessOptions) {
    return (req, res, next) => {
        // Store secret key in request
        req.JWT_SECRET = secret;

        // Build JWT middleware
        let jwtMiddleware = jwt({
            secret: secret,

            // Extracts the token from the Authorization HTTP header
            getToken: (req) => {
                if (req.headers.authorization &&
                    req.headers.authorization.split(' ')[0] === 'Bearer') {
                    return req.headers.authorization.split(' ')[1];
                }
                return null;
            },
        }).unless(unlessOptions);

        // Execute the jwtMiddleware
        jwtMiddleware(req, res, next);
    };
};

module.exports = jwtMiddleware;
