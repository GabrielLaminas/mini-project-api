const express = require('express');

const cors = require('cors');

const app = express();

app.listen('5000', () => console.log('Porta 5000 disponível'));

app.use(cors());

app.use(express.json());

let certificados = [
  {
    id: 1,
    name: "Maria da Silva Silva",
    curso: 'JavaScript',
    quantidadeHoras: 32,
  },
  {
    id: 2,
    name: "Maria da Silva Silva",
    curso: 'CSS3',
    quantidadeHoras: 9,
  },
  {
    id: 3,
    name: "Maria da Silva Silva",
    curso: 'HTML5',
    quantidadeHoras: 6,
  }
];

app.route('/certificado').get((req, res) => {
  const pegarDados = certificados.map((infos) => {
    return {
      id: infos.id,
      curso: infos.curso,
      horas: infos.quantidadeHoras
    }
  });

  res.json(pegarDados);
});