const express = require('express');

module.exports = (app) => {
  const router = express.Router();

  router.post('/', (req, res, next) => {
    /* console.log(req.user);
       console.log(req.body); */
    app.services.account.save({ ...req.body, user_id: req.user.id })
      .then((result) => {
        return res.status(201).json(result[0]);
      }).catch((err) => next(err));
  });

  router.get('/', (req, res) => {
    app.services.account.findAll(req.user.id)
      .then((result) => res.status(200).json(result));
  });

  router.get('/:id', (req, res, next) => {
    app.services.account.find({ id: req.params.id })
      .then((result) => {
        if (result.user_id !== req.user.id) return res.status(403).json({ error: 'Este recurso não pertence ao usuário' })
        return res.status(200).json(result);
      })
      .catch((err) => next(err));
  });

  router.put('/:id', (req, res) => {
    app.services.account.update(req.params.id, req.body)
      .then((result) => res.status(200).json(result[0]));
  });

  router.delete('/:id', (req, res) => {
    app.services.account.remove(req.params.id)
      .then(() => res.status(204).send());
  });

  return router;
};