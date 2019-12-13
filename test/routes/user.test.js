const request = require('supertest');
const app = require('../../src/app');
const jwt = require('jwt-simple');

const MAIN_ROUTE = '/v1/users';

const mail = `${Date.now()}@bmail.com`;
let user;

beforeAll(async () => {
  const res = await app.services.user.save({ name: 'User Accounts', mail: `${Date.now()}@bmail.com`, passwd: '123456' });
  user = { ...res[0] };
  user.token = jwt.encode(user, 'Segredo!');
});

afterAll(async (done) => {
  await app.db.destroy(); // fechando conexão com a instância knexfile(db) após realizar os testes.
  done();
});

test('Deve listar todos os usuários', () => request(app).get(MAIN_ROUTE)
  .set('authorization', `bearer ${user.token}`)
  .then((res) => {
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
  }));

test('Deve inserir usuário com sucesso', () => {
  return request(app).post(MAIN_ROUTE)
    .send({ name: 'Walter Mitty', mail: mail, passwd: '12345' })
    .set('authorization', `bearer ${user.token}`)
    .then((res) => {
      expect(res.status).toBe(201);
      expect(res.body.name).toBe('Walter Mitty');
      expect(res.body).not.toHaveProperty('passwd');
    });
});

test('Deve armazenar senha criptografada', async () => {
  const res = await request(app).post(MAIN_ROUTE)
    .set('authorization', `bearer ${user.token}`)
    .send({ name: 'Walter Mitty', mail: `${Date.now()}@bmail.com`, passwd: '123456' });
  expect(res.status).toBe(201);
  const { id } = res.body;
  const userDB = await app.services.user.findOne({ id });
  expect(userDB.passwd).not.toBeUndefined();
  expect(userDB.passwd).not.toBe('123456');
});

// 1 - Primeira estratégia de requisição assíncrona (com then)
test('Não deve inserir usuário sem nome', () => {
  return request(app).post(MAIN_ROUTE)
    .set('authorization', `bearer ${user.token}`)
    .send({ mail: 'qualquer@bmail.com', passwd: '123456' })
    .then((res) => {
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Nome é um atributo obrigatório');
    });
});

// 2 - Segunda estratégia de requisição assíncrona (com await)
test('Não deve inserir usuário sem email', async () => {
  const result = await request(app).post(MAIN_ROUTE)
    .set('authorization', `bearer ${user.token}`)
    .send({ name: 'Walter Mitty', passwd: '12345' });
  expect(result.status).toBe(400);
  expect(result.body.error).toBe('E-mail é um atributo obrigatório');
});

// 3 - Terceira estratégia de requisição assíncrona (com done)
test('Não deve inserir usuário sem senha', (done) => {
  request(app).post(MAIN_ROUTE)
    .set('authorization', `bearer ${user.token}`)
    .send({ name: 'Walter Mitty', mail: 'qualquer@bmail.com' })
    .then((res) => {
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Senha é um atributo obrigatório');
      done();
    });
});

test('Não deve inserir usuário com email já existente', () => {
  return request(app).post(MAIN_ROUTE)
    .set('authorization', `bearer ${user.token}`)
    .send({ name: 'Walter Mitty', mail: mail, passwd: '12345' })
    .then((res) => {
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Email já existe.');
    });
});
