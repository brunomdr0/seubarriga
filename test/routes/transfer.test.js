const request = require('supertest');
const app = require('../../src/app');

const MAIN_ROUTE = '/v1/transfers';
const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEwMDAwIiwibmFtZSI6IlVzZXIgIzEiLCJtYWlsIjoidXNlcjFAYm1haWwuY29tIn0.kqD8xkgpB9N6LBnO_twF-bPYF2ruhCz3zOFABcNpQJI';

beforeAll(async () => {
  // await app.db.migrate.rollback();
  // await app.db.migrate.latest();
  await app.db.seed.run();
});

afterAll(async (done) => {
  await app.db.destroy(); // fechando conexão com a instância knexfile(db) após realizar os testes.
  done();
});

test('Deve listar apenas os tranferências do usuário', () => {
  return request(app).get(MAIN_ROUTE)
    .set('authorization', `bearer ${TOKEN}`)
    .then((res) => {
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].description).toBe('Transfer #1');
    });
});

test('Deve inserir uma transferência com sucesso', () => {
  return request(app).post(MAIN_ROUTE)
    .set('authorization', `bearer ${TOKEN}`)
    .send({ description: 'Regular Transfer', user_id: 10000, acc_ori_id: 10000, acc_dest_id: 10001, ammount: 100, date: new Date() })
    .then(async (res) => {
      expect(res.status).toBe(201);
      expect(res.body.description).toBe('Regular Transfer');

      const transactions = await app.db('transactions').where({ transfer_id: res.body.id });
      expect(transactions).toHaveLength(2);
      expect(transactions[0].description).toBe('Transfer to acc #10001');
      expect(transactions[1].description).toBe('Transfer to acc #10000');
      expect(transactions[0].ammount).toBe('-100.00');
      expect(transactions[1].ammount).toBe('100.00');
      expect(transactions[0].acc_id).toBe(10000);
      expect(transactions[1].acc_id).toBe(10001);
    });
});

describe('Ao salvar uma transferência válida...', () => {
  let transferId;
  let income;
  let outcome;

  test('Deve retornar o status 201 e os dados da transferência', () => {
    return request(app).post(MAIN_ROUTE)
      .set('authorization', `bearer ${TOKEN}`)
      .send({ description: 'Regular Transfer', user_id: 10000, acc_ori_id: 10000, acc_dest_id: 10001, ammount: 100, date: new Date() })
      .then(async (res) => {
        expect(res.status).toBe(201);
        expect(res.body.description).toBe('Regular Transfer');
        transferId = res.body.id;
      });
  });

  test('As transações equivalentes devem ter sido geradas', async () => {
    const transactions = await app.db('transactions').where({ transfer_id: transferId }).orderBy('ammount');
    expect(transactions).toHaveLength(2);
    [outcome, income] = transactions;
  });

  test('A transação de saída deve ser negativa', async () => {
    expect(outcome.description).toBe('Transfer to acc #10001');
    expect(outcome.ammount).toBe('-100.00');
    expect(outcome.acc_id).toBe(10000);
    expect(outcome.type).toBe('O');
  });

  test('A transação de entrada deve ser positiva', async () => {
    expect(income.description).toBe('Transfer to acc #10000');
    expect(income.ammount).toBe('100.00');
    expect(income.acc_id).toBe(10001);
    expect(income.type).toBe('I');
  });

  test('Ambas devem referenciar a transferência que as originou', () => {
    expect(income.transfer_id).toBe(transferId);
    expect(outcome.transfer_id).toBe(transferId);
  });

  test('Ambas devem estar com status de realizadas', () => {
    expect(income.status).toBe(true);
    expect(outcome.status).toBe(true);
  });
});

describe('Ao tentar salvar uma transferência inválida...', () => {
  let validTransfer;
  beforeAll(() => {
    validTransfer = { description: 'Regular Transfer', user_id: 10000, acc_ori_id: 10000, acc_dest_id: 10001, ammount: 100, date: new Date() }
  });

  const testTemplate = (newData, errorMessage) => {
    return request(app).post(MAIN_ROUTE)
      .set('authorization', `bearer ${TOKEN}`)
      .send({ ...validTransfer, ...newData })
      .then((res) => {
        expect(res.status).toBe(400);
        expect(res.body.error).toBe(errorMessage);
      });
  };

  test('Não deve inserir sem descrição', () => testTemplate({ description: null }, 'Description é atributo obrigatório!'));
  test('Não deve inserir sem descrição', () => testTemplate({ date: null }, 'Data é atributo obrigatório!'));
  test('Não deve inserir sem valor', () => testTemplate({ ammount: null }, 'Valor é atributo obrigatório!'));
  test('Não deve inserir sem conta de origem', () => testTemplate({ acc_ori_id: null }, 'Conta é atributo obrigatório!'));
  test('Não deve inserir sem conta de destino', () => testTemplate({ acc_dest_id: null }, 'Conta é atributo obrigatório!'));
  test('Não deve inserir se as contas de origem e destino forem as mesmas', () => testTemplate({ acc_dest_id: validTransfer.acc_ori_id }, 'Conta fornecida é inválida!'));
  test('Não deve inserir se as contas pertencerem a outro usuário', () => testTemplate({ acc_ori_id: 10002 }, 'Conta não pertence ao usuário!'));
});

test('Deve retornar uma transferência por Id', () => {
  return request(app).get(`${MAIN_ROUTE}/10000`)
    .set('authorization', `bearer ${TOKEN}`)
    .then((res) => {
      expect(res.status).toBe(200);
      expect(res.body.description).toBe('Transfer #1');
    });
});

describe('Ao alterar uma transferência válida...', () => {
  let transferId;
  let income;
  let outcome;

  test('Deve retornar o status 200 e os dados da transferência', () => {
    return request(app).put(`${MAIN_ROUTE}/10000`)
      .set('authorization', `bearer ${TOKEN}`)
      .send({ description: 'Transfer Updated', user_id: 10000, acc_ori_id: 10000, acc_dest_id: 10001, ammount: 500, date: new Date() })
      .then(async (res) => {
        expect(res.status).toBe(200);
        expect(res.body.description).toBe('Transfer Updated');
        expect(res.body.ammount).toBe('500.00');
        transferId = res.body.id;
      });
  });

  test('As transações equivalentes devem ter sido geradas', async () => {
    const transactions = await app.db('transactions').where({ transfer_id: transferId }).orderBy('ammount');
    expect(transactions).toHaveLength(2);
    [outcome, income] = transactions;
  });

  test('A transação de saída deve ser negativa', async () => {
    expect(outcome.description).toBe('Transfer to acc #10001');
    expect(outcome.ammount).toBe('-500.00');
    expect(outcome.acc_id).toBe(10000);
    expect(outcome.type).toBe('O');
  });

  test('A transação de entrada deve ser positiva', async () => {
    expect(income.description).toBe('Transfer to acc #10000');
    expect(income.ammount).toBe('500.00');
    expect(income.acc_id).toBe(10001);
    expect(income.type).toBe('I');
  });

  test('Ambas devem referencias a transferência que as originou', () => {
    expect(income.transfer_id).toBe(transferId);
    expect(outcome.transfer_id).toBe(transferId);
  });
});

describe('Ao tentar alterar uma transferência inválida...', () => {
  let validTransfer;
  beforeAll(() => {
    validTransfer = { description: 'Regular Transfer', user_id: 10000, acc_ori_id: 10000, acc_dest_id: 10001, ammount: 100, date: new Date() }
  });

  const testTemplate = (newData, errorMessage) => {
    return request(app).put(`${MAIN_ROUTE}/10000`)
      .set('authorization', `bearer ${TOKEN}`)
      .send({ ...validTransfer, ...newData })
      .then((res) => {
        expect(res.status).toBe(400);
        expect(res.body.error).toBe(errorMessage);
      });
  };

  test('Não deve inserir sem descrição', () => testTemplate({ description: null }, 'Description é atributo obrigatório!'));
  test('Não deve inserir sem descrição', () => testTemplate({ date: null }, 'Data é atributo obrigatório!'));
  test('Não deve inserir sem valor', () => testTemplate({ ammount: null }, 'Valor é atributo obrigatório!'));
  test('Não deve inserir sem conta de origem', () => testTemplate({ acc_ori_id: null }, 'Conta é atributo obrigatório!'));
  test('Não deve inserir sem conta de destino', () => testTemplate({ acc_dest_id: null }, 'Conta é atributo obrigatório!'));
  test('Não deve inserir se as contas de origem e destino forem as mesmas', () => testTemplate({ acc_dest_id: validTransfer.acc_ori_id }, 'Conta fornecida é inválida!'));
  test('Não deve inserir se as contas pertencerem a outro usuário', () => testTemplate({ acc_ori_id: 10002 }, 'Conta não pertence ao usuário!'));
});

describe('Ao remover uma transferência', () => {
  test('Deve retornar o status 204', () => {
    return request(app).delete(`${MAIN_ROUTE}/10000`)
      .set('authorization', `bearer ${TOKEN}`)
      .then((res) => {
        expect(res.status).toBe(204);
      });
  });

  test('O registro deve ter sido removido do banco', () => {
    return app.db('transfers').where({ id: 10000 })
      .then((result) => {
        expect(result).toHaveLength(0);
      });
  });

  test('As transações associadas devem ter sido removidas', () => {
    return app.db('transactions').where({ transfer_id: 10000 })
      .then((result) => {
        expect(result).toHaveLength(0);
      });
  });

  test('Não deve retornar transferência de outro usuário', () => {
    return request(app).get(`${MAIN_ROUTE}/10001`)
      .set('authorization', `bearer ${TOKEN}`)
      .then((res) => {
        expect(res.status).toBe(403);
        expect(res.body.error).toBe('Este recurso não pertence ao usuário');
      });
  });
});
