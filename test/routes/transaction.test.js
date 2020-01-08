const request = require('supertest');
const jwt = require('jwt-simple');
const app = require('../../src/app');

const MAIN_ROUTE = '/v1/transactions';

let user;
let user2;
let accUser;
let accUser2;

beforeAll(async () => {
  // Estratégia para realizar os testes de transação
  // #1 limpar as tabelas do banco.
  await app.db('transactions').del();
  await app.db('transfers').del();
  await app.db('accounts').del();
  await app.db('users').del();
  // #2 limpar as tabelas do banco.
  const users = await app.db('users').insert([
    { name: 'User #1', mail: 'user@bmail.com', passwd: '$2a$10$AHRKVQBtP/YDjpNVbrVwiuvWwB6xRNrvQE83v2jcojEvLt2YnTXGG' },
    { name: 'User #2', mail: 'user2@bmail.com', passwd: '$2a$10$AHRKVQBtP/YDjpNVbrVwiuvWwB6xRNrvQE83v2jcojEvLt2YnTXGG' },
  ], '*');
  [user, user2] = users;
  delete user.passwd;
  user.token = jwt.encode(user, 'Segredo!');
  // #3 limpar as tabelas do banco.
  const accs = await app.db('accounts').insert([
    { name: 'Acc #1', user_id: user.id },
    { name: 'Acc #2', user_id: user2.id },
  ], '*');
  [accUser, accUser2] = accs;
});

afterAll(async (done) => {
  await app.db.destroy(); // fechando conexão com a instância knexfile(db) após realizar os testes.
  done();
});

test('Deve listar apenas as transações do usuário', () => {
  return app.db('transactions').insert([
    { description: 'T1', date: new Date(), ammount: 100, type: 'I', acc_id: accUser.id },
    { description: 'T2', date: new Date(), ammount: 300, type: 'O', acc_id: accUser2.id },
  ]).then(() => request(app).get(MAIN_ROUTE)
    .set('authorization', `bearer ${user.token}`)
    .then((res) => {
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].description).toBe('T1');
    }));
});

test('Deve inserir uma transação com sucesso', () => {
  return request(app).post(MAIN_ROUTE)
    .set('authorization', `bearer ${user.token}`)
    .send({ description: 'New T', date: new Date(), ammount: 100, type: 'I', acc_id: accUser.id })
    .then((res) => {
      expect(res.status).toBe(201);
      expect(res.body.acc_id).toBe(accUser.id);
    });
});

describe('Não deve realizar transação com dados inválidos', () => {
  let validTransaction;
  beforeAll(() => {
    validTransaction = { description: 'New T', date: new Date(), ammount: 100, type: 'I', acc_id: accUser.id }
  });
  const testTemplate = (newData, errorMessage) => {
    return request(app).post(MAIN_ROUTE)
      .set('authorization', `bearer ${user.token}`)
      .send({ ...validTransaction, ...newData })
      .then((res) => {
        expect(res.status).toBe(400);
        expect(res.body.error).toBe(errorMessage);
      });
  };
  test('Não deve inserir sem descricão', () => testTemplate({ description: null }, 'Description é um atributo obrigatório!'));
  test('Não deve inserir sem date', () => testTemplate({ date: null }, 'Date é um atributo obrigatório!'));
  test('Não deve inserir sem ammount', () => testTemplate({ ammount: null }, 'Ammount é um atributo obrigatório!'));
  test('Não deve inserir sem type', () => testTemplate({ type: null }, 'Type é um atributo obrigatório!'));
  test('Não deve inserir sem acc_id', () => testTemplate({ acc_id: null }, 'acc_id é um atributo obrigatório!'));
});

test('Transações de entrada devem ser positivas', () => {
  return request(app).post(MAIN_ROUTE)
    .set('authorization', `bearer ${user.token}`)
    .send({ description: 'New T', date: new Date(), ammount: -100, type: 'I', acc_id: accUser.id })
    .then((res) => {
      expect(res.status).toBe(201);
      expect(res.body.ammount).toBe('100.00');
      expect(res.body.acc_id).toBe(accUser.id);
    });
});

test('Transações de saída devem ser negativas', () => {
  return request(app).post(MAIN_ROUTE)
    .set('authorization', `bearer ${user.token}`)
    .send({ description: 'New T', date: new Date(), ammount: 100, type: 'O', acc_id: accUser.id })
    .then((res) => {
      expect(res.status).toBe(201);
      expect(res.body.ammount).toBe('-100.00');
      expect(res.body.acc_id).toBe(accUser.id);
    });
});

test('Deve retornar uma transação por ID', () => {
  return app.db('transactions').insert(
    { description: 'T ID', date: new Date(), ammount: 100, type: 'I', acc_id: accUser.id }, ['id']
  ).then(trans => request(app).get(`${MAIN_ROUTE}/${trans[0].id}`)
    .set('authorization', `bearer ${user.token}`)
    .then(res => {
      expect(res.status).toBe(200);
      expect(res.body.id).toBe(trans[0].id);
      expect(res.body.description).toBe('T ID');
    }));
});

test('Deve alterar uma transação', () => {
  return app.db('transactions').insert(
    { description: 'To update', date: new Date(), ammount: 100, type: 'I', acc_id: accUser.id }, ['id']
  ).then(res => request(app).put(`${MAIN_ROUTE}/${res[0].id}`)
    .send({ description: 'updated', ammount: 500 })
    .set('authorization', `bearer ${user.token}`)
    .then(res => {
      expect(res.status).toBe(200);
      expect(res.body.ammount).toBe('500.00');
      expect(res.body.description).toBe('updated');
    }));
});

test('Deve remover uma transação', () => {
  return app.db('transactions').insert(
    { description: 'To be removed', date: new Date(), ammount: 100, type: 'I', acc_id: accUser.id }, ['id']
  ).then(res => request(app).delete(`${MAIN_ROUTE}/${res[0].id}`)
    .set('authorization', `bearer ${user.token}`)
    .then(res => {
      expect(res.status).toBe(204);
    }));
});

test('Não deve remover uma transação de outro usuário', () => {
  return app.db('transactions').insert(
    { description: 'To be denied', date: new Date(), ammount: 100, type: 'I', acc_id: accUser2.id }, ['id']
  ).then(res => request(app).delete(`${MAIN_ROUTE}/${res[0].id}`)
    .set('authorization', `bearer ${user.token}`)
    .then(res => {
      expect(res.status).toBe(403);
    }));
});

test('Não deve alterar uma transação de outro usuário', () => {
  return app.db('transactions').insert(
    { description: 'To update', date: new Date(), ammount: 100, type: 'I', acc_id: accUser2.id }, ['id']
  ).then(res => request(app).put(`${MAIN_ROUTE}/${res[0].id}`)
    .send({ description: 'updated', ammount: 500 })
    .set('authorization', `bearer ${user.token}`)
    .then(res => {
      expect(res.status).toBe(403);
      expect(res.body.error).toBe('Este recurso não pertence ao usuário');
    }));
});

test.skip('Não deve remover uma conta com transação', () => {
  return app.db('transactions').insert(
    { description: 'To be denied', date: new Date(), ammount: 700, type: 'I', acc_id: accUser.id }, ['id']
  ).then(() => request(app).delete(`/v1/accounts/${accUser.id}`)
    .set('authorization', `bearer ${user.token}`)
    .then(res => {
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Essa conta possui transações associadas');
    }));
});

test('Não deve retornar a transação por ID de outro usuário', () => {
  return app.db('transactions').insert(
    { description: 'T ID', date: new Date(), ammount: 100, type: 'I', acc_id: accUser2.id }, ['id']
  ).then(trans => request(app).get(`${MAIN_ROUTE}/${trans[0].id}`)
    .set('authorization', `bearer ${user.token}`)
    .then(res => {
      expect(res.status).toBe(403);
      expect(res.body.error).toBe('Este recurso não pertence ao usuário');
    }));
});
