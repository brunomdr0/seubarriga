const request = require('supertest');

const app = require('../src/app'); // exportando o arquivo app.js, você permite a função seja usada como objeto de teste

test('Devo responder na raiz com status 200', () => request(app).get('/')
  .then((res) => expect(res.status).toBe(200)));
