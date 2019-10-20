const app = require('express')();

app.get('/', (req, res) => { // Essa função habilita a rota /, e quem acessa-la receberá um status 200
    res.status(200).send();
});

module.exports = app;