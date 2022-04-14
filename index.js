const CryptoJS = require("crypto-js");
const pdf = require('html-pdf');
const ejs = require('ejs');

const express = require('express');
const cors = require('cors');
const app = express();
const path = require('path');

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

app.route('/certificado').post((req, res) => {
  const { id, curso, timestamp, dataEmissao } = req.body;

  const certificado = certificados.find((certificado) => certificado.id === id)

  if(certificado){

    const hash = { 
      id, 
      timestamp 
    };

    const encriptar = CryptoJS.AES.encrypt(JSON.stringify(hash), "Secret Passphrase").toString();

    const atualizarCertificado = {
      ...certificado,
      timestamp,
      dataEmissao,
      hash: encriptar
    };
    
    certificados = certificados.map((certificado) => {
      if(certificado.id === id){
        certificado = atualizarCertificado;
      }

      return certificado;
    });

    const dataEjs = {
      id: id,
      time: timestamp,
      nome: certificado.name,
      curso: certificado.curso,
      horas: certificado.quantidadeHoras,
      data: dataEmissao,
      hash: encriptar
    }

    ejs.renderFile(
      path.join(__dirname + '/certification.ejs'), 
      dataEjs, 
      (err, html) => {
        if(err){
          return res.send(err);
        }

        const optionsPdf = { 
          "format": "A3",        
          "orientation": "landscape",
          "border": {
            "top": "32px",            
            "right": "32px",
            "bottom": "32px",
            "left": "32px"
          },
        };
          
        pdf.create(html, optionsPdf)
        .toFile(
          path.join(__dirname + '/src/download' + `/certificado${curso}.pdf`), 
          (err, filepath) => {
            if(err){
              return res.json(err);
            }

            res.type('pdf')
            return res.download(path.join(__dirname + '/src/download' + `/certificado${curso}.pdf`))
          }
        )
    });
  }
  
  else{
    return res.json('Certificado não existe');
  }

});