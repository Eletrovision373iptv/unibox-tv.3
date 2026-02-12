const express = require('express');
const router = express.Router();
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Caminho para o seu JSON de IDs (ajuste o nome do arquivo se necessário)
const idsPath = path.join(__dirname, 'ids_band.json');

router.get('/live/:id', (req, res) => {
    const channelId = req.params.id;
    
    // 1. Carregar a URL do canal do seu JSON
    let ids = {};
    if (fs.existsSync(idsPath)) {
        ids = JSON.parse(fs.readFileSync(idsPath, 'utf8'));
    }

    const targetUrl = ids[channelId];

    if (!targetUrl) {
        return res.status(404).send("Canal não encontrado no arquivo JSON.");
    }

    // 2. Usar o yt-dlp para pegar o link real (.m3u8)
    // O comando -g apenas retorna a URL, sem baixar nada.
    const command = `/usr/local/bin/yt-dlp -g "${targetUrl}"`;

    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error(`Erro yt-dlp: ${error.message}`);
            return res.status(500).send("Erro ao capturar o streaming. Verifique os logs.");
        }

        const streamUrl = stdout.trim();

        if (streamUrl) {
            console.log(`✅ Redirecionando para: ${streamUrl}`);
            // 3. REDIRECIONAR o usuário para o link real
            // Isso faz o player do usuário falar direto com a emissora
            res.redirect(302, streamUrl);
        } else {
            res.status(404).send("Não foi possível gerar o link de streaming.");
        }
    });
});

module.exports = router;
