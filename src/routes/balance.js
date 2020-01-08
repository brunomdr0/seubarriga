const express = require('express');

module.exports = (app) => {
  const router = express.Router();
  console.log('passou aqui 1');

  router.get('/', (req, res, next) => {
    app.services.balance.getSaldo(req.user.id)
      .then(result => res.status(200).json(result))
      .catch(err => next(err));
  });

  return router;
};
