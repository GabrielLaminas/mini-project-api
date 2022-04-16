const CryptoJS = require("crypto-js");
const pdf = require('html-pdf');
const ejs = require('ejs');

const multer = require('multer');
const PDFParser = require('pdf2json');

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const app = express();
const path = require('path');

const port = process.env.PORT || 5000;

app.use(cors());

var corsOptions = {
  "origin": "*",
  "methods": "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
  "preflightContinue": false,
  "optionsSuccessStatus": 202 // some legacy browsers (IE11, various SmartTVs) choke on 204
}

app.use(express.json());
/*
fs.mkdirSync('upload/', { recursive: true}, (err) => {
  if (err) throw err;
});*/

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

const storage = multer.diskStorage({
  destination: function(req, file, cb){
    cb(null, 'upload/');
  },
  filename: function(req, file, cb){
    cb(null, file.originalname + Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

app.route('/listagem').get((req, res) => {
  const pegarDados = certificados.map((infos) => {
    return {
      id: infos.id,
      curso: infos.curso,
      horas: infos.quantidadeHoras
    }
  });

  res.json(pegarDados);
});

app.post('/certificado', cors(corsOptions), ((req, res) => {
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
          path.join(__dirname + '/download' + `/certificado${curso}.pdf`),
          (err, filepath) => {
            if(err){
              return res.json(err);
            }

            res.type('pdf')
            return res.download(path.join(__dirname + '/download' + `/certificado${curso}.pdf`))
          }
        )
    });
  }
  
  else{
    return res.json('Certificado não existe');
  }

}));

app.post('/validacao', upload.single('pdf'), async (req, res) => {

  const caminho = `${req.file.destination}${req.file.filename}`;

  if(fs.existsSync(caminho)){
    const pdfParser = new PDFParser(this, 1);

    pdfParser.on("pdfParser_dataError", (errData) => {
      res.send(errData.parserError)
    });
    
    pdfParser.on("pdfParser_dataReady", (pdfdata) => {

      const textoPdf = pdfParser.getRawTextContent();
      const arrayTextoPdf = textoPdf.split(/\r\n/);
      const hashReverso = { "hash": arrayTextoPdf[5] };
      const decriptar = CryptoJS.AES.decrypt(hashReverso.hash, "Secret Passphrase").toString(CryptoJS.enc.Utf8);
      
      if(decriptar.length > 0){
        const ObjData = JSON.parse(decriptar);

        const validar = certificados.find((certificado) => {
          if((certificado.id === ObjData.id) && (certificado.timestamp === ObjData.timestamp)){
            return certificado;
          }
        });

        if(validar){
          return res.send({
            tipo: 'sucesso',
            mensagem: 'Pdf valido',
          });
        }

        else{
          return res.send({
            tipo: 'error',
            mensagem: 'Pdf não é valido',
          });
        }
  
      }
      else{
        return res.send({
          tipo: 'error',
          mensagem: 'Pdf não é valido',
        });
      }

    });
    
    pdfParser.loadPDF(caminho);
  }
  else{
    res.send({
      tipo: 'error',
      mensagem: 'caminho não existe'
    });
  }
});

app.listen(port, () => console.log(`Porta ${port} disponível`));

module.exports = app;