const app = require('express')();
const bodyPaser = require('body-parser');

app.use(bodyPaser.json());

app.get('/', (req, res) => { // Essa função habilita a rota /, e quem acessa-la receberá um status 200
  res.status(200).send();
});

app.get('/users', (req, res) => {
  const users = [
    { name: 'John Doe', bmail: 'john@mail.com' },
  ];
  res.status(200).json(users);
});

app.post('/users', (req, res) => {
  res.status(201).json(req.body);
});

module.exports = app;
