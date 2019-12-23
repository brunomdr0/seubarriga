
exports.seed = (knex) => {
  // Deletes ALL existing tables
  return knex('transactions').del()
    .then(() => knex('transfers').del())
    .then(() => knex('accounts').del())
    .then(() => knex('users').del())
  // Inserts ALL existing tables
    .then(() => knex('users').insert([
      { name: 'User #1', mail: 'user1@bmail.com', passwd: '$2a$10$AHRKVQBtP/YDjpNVbrVwiuvWwB6xRNrvQE83v2jcojEvLt2YnTXGG' },
      { name: 'User #2', mail: 'user2@bmail.com', passwd: '$2a$10$AHRKVQBtP/YDjpNVbrVwiuvWwB6xRNrvQE83v2jcojEvLt2YnTXGG' },
    ]));
};
