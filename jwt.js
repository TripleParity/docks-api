/*
 * Simple helper module to build the JWT token used throughout the application
 */

const jwt = require('express-jwt');

// Function to build the JWT middleware
const jwtMiddleware = function(secret) {
    return jwt({
        secret: secret,

        // Extracts the token from the Authorization HTTP header
        getToken: (req) => {
            if (req.headers.authorization &&
                req.headers.authorization.split(' ')[0] === 'Bearer') {
                return req.headers.authorization.split(' ')[1];
            }
            return null;
        },
    });
};

module.exports = jwtMiddleware;
