const moment = require('moment');

exports.seed = (knex) => {
  // Deletes ALL existing entries
  return knex('users').insert([
    { id: 10100, name: 'User #3', mail: 'user3@bmail.com', passwd: '$2a$10$AHRKVQBtP/YDjpNVbrVwiuvWwB6xRNrvQE83v2jcojEvLt2YnTXGG' },
    { id: 10101, name: 'User #4', mail: 'user4@bmail.com', passwd: '$2a$10$AHRKVQBtP/YDjpNVbrVwiuvWwB6xRNrvQE83v2jcojEvLt2YnTXGG' },
    { id: 10102, name: 'User #5', mail: 'user5@bmail.com', passwd: '$2a$10$AHRKVQBtP/YDjpNVbrVwiuvWwB6xRNrvQE83v2jcojEvLt2YnTXGG' },
  ])
    .then(() => knex('accounts').insert([
      { id: 10100, name: 'Acc Saldo Principal', user_id: 10100 },
      { id: 10101, name: 'Acc Saldo Sencundário', user_id: 10100 },
      { id: 10102, name: 'Acc Alternativa 1', user_id: 10101 },
      { id: 10103, name: 'Acc Alternativa 2', user_id: 10101 },
      { id: 10104, name: 'Acc Geral Alternativa 1', user_id: 10102 },
      { id: 10105, name: 'Acc Geral Alternativa 2', user_id: 10102 },
    ]))
    .then(() => knex('transfers').insert([
      { id: 10100, description: 'Transfer #1', user_id: 10102, acc_ori_id: 10105, acc_dest_id: 10104, ammount: 256, date: new Date() },
      { id: 10101, description: 'Transfer #2', user_id: 10101, acc_ori_id: 10102, acc_dest_id: 10103, ammount: 512, date: new Date() },
    ]))
    .then(() => knex('transactions').insert([
      // Uma transação positiva / Saldo = 2
      { description: 'Indiferente', date: new Date(), ammount: 2, type: 'I', acc_id: 10104, status: true },
      // Transação usuário errado / Saldo = 2
      { description: 'Indiferente', date: new Date(), ammount: 4, type: 'I', acc_id: 10102, status: true },
      // Transação outra conta / Saldo = 2 / saldo = 8
      { description: 'Indiferente', date: new Date(), ammount: 8, type: 'I', acc_id: 10105, status: true },
      // Transação pendente / Saldo = 2 / Saldo = x
      { description: 'Indiferente', date: new Date(), ammount: 16, type: 'I', acc_id: 10104, status: false },
      // Transação passada / Saldo = 34 / Saldo = x
      { description: 'Indiferente', date: moment().subtract({ days: 5 }), ammount: 32, type: 'I', acc_id: 10104, status: true },
      // Transação futura / Saldo = 34 / Saldo = x
      { description: 'Indiferente', date: moment().add({ days: 5 }), ammount: 64, type: 'I', acc_id: 10104, status: true },
      // Uma transação negativa / Saldo = -94 / Saldo = 8
      { description: 'Indiferente', date: moment(), ammount: -128, type: 'O', acc_id: 10104, status: true },
      // Transf / Saldo = 162 / Saldo = -248
      { description: 'Indiferente', date: moment(), ammount: 256, type: 'I', acc_id: 10104, status: true },
      { description: 'Indiferente', date: moment(), ammount: -256, type: 'O', acc_id: 10105, status: true },
      // Transf / Saldo = 162 / Saldo = -248
      { description: 'Indiferente', date: moment(), ammount: 512, type: 'I', acc_id: 10103, status: true },
      { description: 'Indiferente', date: moment(), ammount: -512, type: 'O', acc_id: 10102, status: true },
    ]));
};
