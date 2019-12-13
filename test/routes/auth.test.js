const request = require('supertest');
const app = require('../../src/app');


const MAIN_ROUTE = '/auth';

afterAll(async (done) => {
  await app.db.destroy(); // fechando conexão com a instância knexfile(db) após realizar os testes.
  done();
});

test('Deve criar um usuário via signup', () => {
  return request(app).post(`${MAIN_ROUTE}/signup`)
    .send({ name: 'Walter', mail: `${Date.now()}@bmail.com`, passwd: '123456' })
    .then((res) => {
      expect(res.status).toBe(201);
      expect(res.body.name).toBe('Walter');
      expect(res.body).toHaveProperty('mail');
      expect(res.body).not.toHaveProperty('passwd');
    });
});

test('Deve receber um token ao logar', () => {
  const mail = `${Date.now()}@bmail.com`;
  return app.services.user.save(
    { name: 'Walter', mail, passwd: '123456' }
  ).then(() => request(app).post(`${MAIN_ROUTE}/signin`)
    .send({ mail, passwd: '123456' }))
    .then((res) => {
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
    });
});

test('Deve receber um token ao logar', () => {
  const mail = `${Date.now()}@bmail.com`;
  return app.services.user.save(
    { name: 'Walter', mail, passwd: '123456' }
  ).then(() => request(app).post(`${MAIN_ROUTE}/signin`)
    .send({ mail, passwd: '654321' }))
    .then((res) => {
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Usuário ou senha inválido');
    });
});

test('Deve receber um token ao logar', () => {
  return request(app).post(`${MAIN_ROUTE}/signin`)
    .send({ mail: 'naoExiste@}@bmail.com', passwd: '654321' })
    .then((res) => {
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Usuário ou senha inválido');
    });
});

test('Não deve acessar uma rota protegida sem token', () => {
  return request(app).get('/v1/users')
    .then((res) => {
      expect(res.status).toBe(401);
    });
});
