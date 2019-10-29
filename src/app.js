const app = require('express')();
const consign = require('consign');
const knex = require('knex');
const knexfile = require('../knexfile');

// TODO: criar chaveamento dinâmico;
app.db = knex(knexfile.test);

consign({ cwd: 'src' })
  .include('./config/middlewares.js')
  .then('/routes')
  .then('/config/routes.js')
  .into(app);

app.get('/', (req, res) => { // Essa função habilita a rota /, e quem acessa-la receberá um status 200
  res.status(200).send();
});

module.exports = app;
