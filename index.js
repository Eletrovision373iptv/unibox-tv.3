const express = require('express');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 10000; // Porta padrão do Render

// Importar as rotas dos outros servidores (ajustados para serem módulos)
// Para o Render, vamos criar um seletor simples ou rodar todos na mesma porta com prefixos
// Mas para manter a simplicidade e o visual que você gostou, vamos criar uma Home que linka para os 3.

app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="pt-br">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>UNIBOX TV - Home</title>
            <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
            <style>
                body { background: #121212; color: #fff; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; font-family: sans-serif; }
                .container { text-align: center; max-width: 600px; }
                .btn-box { padding: 20px; margin: 10px; border-radius: 10px; text-decoration: none; color: #fff; font-weight: bold; display: block; transition: 0.3s; font-size: 1.2rem; }
                .btn-record { background: #bf40bf; }
                .btn-record:hover { background: #993399; transform: scale(1.05); }
                .btn-band { background: #e6e600; color: #000; }
                .btn-band:hover { background: #cccc00; transform: scale(1.05); }
                .btn-redetv { background: #00aeef; }
                .btn-redetv:hover { background: #008cc0; transform: scale(1.05); }
                h2 { margin-bottom: 30px; }
            </style>
        </head>
        <body>
            <div class="container">
                <h2>📺 SELECIONE O PAINEL</h2>
                <a href="/record" class="btn-box btn-record">RECORDPLUS (LILÁS)</a>
                <a href="/band" class="btn-box btn-band">BAND (AMARELA)</a>
                <a href="/redetv" class="btn-box btn-redetv">REDETV! (AZUL)</a>
            </div>
        </body>
        </html>
    `);
});

// Wrapper para rodar os servidores como "sub-apps"
const recordApp = require('./server_module.js');
const bandApp = require('./band_module.js');
const redetvApp = require('./redetv_module.js');

app.use('/record', recordApp);
app.use('/band', bandApp);
app.use('/redetv', redetvApp);

app.listen(PORT, () => {
    console.log(`🚀 UNIBOX unificado rodando na porta ${PORT}`);
});
