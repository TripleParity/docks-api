/* eslint-disable */

const frisby = require('frisby');
const Joi = frisby.Joi; // Frisby exports Joi for convenience on type assersions

const host = 'http://127.0.0.1:8080';

const username = 'admin';
const password = 'admin';

const credentials = {
  username: username,
  password: password,
};

const tokenURL = host + '/api/auth/token';

// WARNING: These tests will cause damage to a production database
// if the default 'admin/admin' credentials are used.

// TODO(egeldenhuys): Make test cases idempotent
// TODO(egeldenhuys): Use beforeEach() and afterEach()

describe('Authentication', function() {
  it('should not serve Docker API requests without a JWT', function() {
    return frisby.get(host + '/docker/containers/json').expect('status', 401);
  });

  it('should serve JWT for valid ("admin/admin") credentials', function() {
    return frisby
      .post(tokenURL, credentials)
      .expect('status', 200)
      .expect('bodyContains', 'jwt')
      .expect('jsonTypes', 'jwt', Joi.string().required())
      .then(function(res) {
        let jwt = res.json['jwt'];

        return frisby
          .fetch(host + '/', {
            method: 'GET',
            headers: {
              Authorization: 'Bearer ' + jwt,
            },
          })
          .expect('status', 200)
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

describe('User Management', function() {
  it('should not give access to "List Users" without valid JWT', function() {
    return frisby.get(host + '/users').expect('status', 401);
  });

  it('should not give access to "Create User" without valid JWT', function() {
    return frisby
      .post(host + '/users', {
        username: 'john',
        password: 'bucket',
      })
      .expect('status', 401);
  });

  it('should not give access to "Update User" without valid JWT', function() {
    return frisby
      .put(host + '/users/admin', {
        password: 'password',
      })
      .expect('status', 401);
  });

  it('should not give access to "Delete" without valid JWT', function() {
    return frisby.delete(host + '/users/admin').expect('status', 401);
  });

  it('should be able to create new users if they do not exist', function() {
    return frisby
      .post(host + '/api/auth/token', {
        username: 'admin',
        password: 'admin',
      })
      .then((res) => {
        expect(res.json.jwt).toBeTruthy();
        const jwt = res.json.jwt;

        return frisby
          .fetch(host + '/users', {
            method: 'POST',
            headers: {
              Authorization: 'Bearer ' + jwt,
            },
            body: JSON.stringify({
              username: 'test_fred',
              password: 'mahPass',
            }),
          })
          .expect('status', 200)
          .then((res2) => {
            frisby
              .fetch(host + '/users', {
                method: 'POST',
                headers: {
                  Authorization: 'Bearer ' + jwt,
                },
                body: JSON.stringify({
                  username: 'test_fred',
                  password: 'mahPass2',
                }),
              })
              .expect('status', 409);
          });
      });
  });

  it('should be able to change the password of an existing user', function() {
    return frisby.post(tokenURL, credentials).then((res) => {
      expect(res.json.jwt).toBeTruthy();
      const jwt = res.json.jwt;

      return frisby
        .fetch(host + '/users/test_fred', {
          method: 'PUT',
          headers: {
            Authorization: 'Bearer ' + jwt,
          },
          body: JSON.stringify({
            password: 'newPass',
          }),
        })
        .expect('status', 200)
        .then((res2) => {
          return frisby
            .fetch(host + '/users/dude8u9348u9r', {
              method: 'PUT',
              headers: {
                Authorization: 'Bearer ' + jwt,
              },
              body: JSON.stringify({
                password: 'lel',
              }),
            })
            .expect('status', 404);
        });
    });
  });

  it('should allow new users to login', function() {
    return frisby
      .post(host + '/api/auth/token', {
        username: 'test_fred',
        password: 'newPass',
      })
      .expect('status', 200)
      .expect('bodyContains', 'jwt')
      .expect('jsonTypes', 'jwt', Joi.string().required());
  });

  it('should be able to delete users', function() {
    return frisby.post(tokenURL, credentials).then((res) => {
      expect(res.json.jwt).toBeTruthy();
      const jwt = res.json.jwt;

      return frisby
        .fetch(host + '/users/test_fred', {
          method: 'DELETE',
          headers: {
            Authorization: 'Bearer ' + jwt,
          },
        })
        .expect('status', 200)
        .then((res2) => {
          return frisby
            .fetch(host + '/users/fgh556ttffg', {
              method: 'DELETE',
              headers: {
                Authorization: 'Bearer ' + jwt,
              },
            })
            .expect('status', 404);
        });
    });
  });
});
