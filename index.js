const express = require('express');

const cors = require('cors');

const app = express();

app.listen('3000', () => console.log('porta 3000'));

app.use(cors());

app.use(express.json());

const data = new Date();
const formatData = data.toLocaleDateString(
  'pt-br',
  {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }
);

let certificado = {
  id: 1,
  name: "Gabriel de Freitas Laminas",
  timestamp: data,
  curso: 'Python',
  quantidadeHoras: 8,
  dataEmissao: formatData 
};

app.route('/').get((req, res) => res.json(certificado))