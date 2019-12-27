const ValidationError = require('../errors/ValidationError');

module.exports = (app) => {
  const find = (filter = {}) => {
    return app.db('transfers')
      .where(filter)
      .select();
  };
  const findOne = (filter = {}) => {
    return app.db('transfers')
      .where(filter)
      .first();
  };
  const save = async (transfer) => {
    if (!transfer.description) throw new ValidationError('Description é atributo obrigatório!');
    if (!transfer.date) throw new ValidationError('Data é atributo obrigatório!');
    if (!transfer.ammount) throw new ValidationError('Valor é atributo obrigatório!');
    if (!transfer.acc_ori_id) throw new ValidationError('Conta é atributo obrigatório!');
    if (!transfer.acc_dest_id) throw new ValidationError('Conta é atributo obrigatório!');
    if (transfer.acc_dest_id === transfer.acc_ori_id) throw new ValidationError('Conta fornecida é inválida!');

    const accounts = await app.db('accounts').whereIn('id', [transfer.acc_dest_id, transfer.acc_ori_id])
    accounts.forEach((acc) => {
      if (acc.user_id !== parseInt(transfer.user_id, 10)) throw new ValidationError('Conta não pertence ao usuário!')
    });

    const result = await app.db('transfers').insert(transfer, '*');
    const transferId = result[0].id;

    const transactions = [
      { description: `Transfer to acc #${transfer.acc_dest_id}`, date: transfer.date, ammount: transfer.ammount * -1, type: 'O', acc_id: transfer.acc_ori_id, transfer_id: transferId },
      { description: `Transfer to acc #${transfer.acc_ori_id}`, date: transfer.date, ammount: transfer.ammount, type: 'I', acc_id: transfer.acc_dest_id, transfer_id: transferId },
    ];

    await app.db('transactions').insert(transactions);
    return result;
  };
  return { find, save, findOne };
};
