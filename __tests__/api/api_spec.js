const frisby = require('frisby');
const Joi = frisby.Joi; // Frisby exports Joi for convenience on type assersions

const host = 'http://127.0.0.1:8080';

describe('Authentication', function() {

    it('should not serve Docker API requests without a JWT', function () {
        return frisby.get(host + '/docker/containers/json')
            .expect('status', 401);
    });

    it('should serve JWT for valid ("admin/admin") credentials', function() {
        return frisby
            .post(host + '/api/auth/token', {
                username: 'admin',
                password: 'admin',
            })
            .expect('status', 200)
            .expect('bodyContains', 'jwt')
            .expect('jsonTypes', 'jwt', Joi.string().required())
            .then(function(res) {
               let jwt = res.json['jwt'];

               return frisby.fetch(host + '/', {
                   method: 'GET',
                   headers: {
                       Authorization: 'Bearer ' + jwt,
                   },
               }).expect('status', 200)
                   .expect('bodyContains', 'Welcome to Express');
            });
    });

    it('should not serve JWT for invalid username', function() {
        return frisby
            .post(host + '/api/auth/token', {
                username: 'h4z0r',
                password: 'admin',
            })
            .expect('status', 401)
            .expectNot('bodyContains', 'jwt');
    });

    it('should not serve JWT for invalid password', function() {
        return frisby
            .post(host + '/api/auth/token', {
                username: 'admin',
                password: 'h4x0r',
            })
            .expect('status', 401)
            .expectNot('bodyContains', 'jwt');
    });
});