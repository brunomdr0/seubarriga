const ValidationError = require('../errors/ValidationError');

module.exports = (app) => {
  const find = (userId, filter = {}) => {
    return app.db('transactions')
      .join('accounts', 'accounts.id', 'acc_id')
      .where(filter)
      .andWhere('accounts.user_id', '=', userId)
      .select();
  };

  const findOne = (filter) => {
    return app.db('transactions')
      .where(filter)
      .first();
  };

  const update = (id, transaction) => {
    return app.db('transactions')
      .where({ id })
      .update(transaction, '*');
  };

  const save = (transaction) => {
    const newTransaction = { ...transaction };
    if (!newTransaction.description) throw new ValidationError('Description é um atributo obrigatório!');
    if (!newTransaction.date) throw new ValidationError('Date é um atributo obrigatório!');
    if (!newTransaction.ammount) throw new ValidationError('Ammount é um atributo obrigatório!');
    if (!(newTransaction.type === 'I' || newTransaction.type === 'O')) throw new ValidationError('Type é um atributo obrigatório!');
    if (!newTransaction.acc_id) throw new ValidationError('acc_id é um atributo obrigatório!');

    if ((transaction.type === 'I' && transaction.ammount < 0)
      || (transaction.type === 'O' && transaction.ammount > 0)) {
      newTransaction.ammount *= -1;
    }
    return app.db('transactions').insert(newTransaction, '*');
  };

  const remove = (id) => {
    return app.db('transactions')
      .where({ id })
      .del();
  };
  return { find, findOne, update, save, remove };
};
