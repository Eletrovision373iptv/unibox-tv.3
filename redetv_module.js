const express = require('express');
const router = express.Router();
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Garante o caminho absoluto para o JSON
const idsPath = path.join(__dirname, 'ids_redetv.json');

router.get('/live/:id', (req, res) => {
    const channelId = req.params.id;
    
    // 1. Verificar se o arquivo existe antes de tentar ler
    if (!fs.existsSync(idsPath)) {
        console.error(`❌ ARQUIVO NÃO ENCONTRADO: ${idsPath}`);
        return res.status(500).send("Erro interno: Arquivo de configuração não encontrado.");
    }

    // 2. Ler e converter o JSON
    const conteudo = fs.readFileSync(idsPath, 'utf8');
    const canais = JSON.parse(conteudo);

    // 3. Procurar o canal (fazendo um 'trim' para evitar espaços invisíveis)
    const canalEncontrado = canais.find(c => c.id.trim() === channelId.trim());

    if (!canalEncontrado) {
        console.log(`⚠️ Canal [${channelId}] não existe no JSON. IDs disponíveis:`, canais.map(c => c.id));
        return res.status(404).send(`Canal [${channelId}] não encontrado no arquivo JSON.`);
    }

    const targetUrl = canalEncontrado.url;

    // 4. Executar yt-dlp
    const command = `/usr/local/bin/yt-dlp --user-agent "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" -g "${targetUrl}"`;

    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error(`❌ Erro yt-dlp: ${error.message}`);
            return res.status(500).send("Erro ao capturar o streaming.");
        }

        const streamUrl = stdout.trim();
        if (streamUrl) {
            res.redirect(302, streamUrl);
        } else {
            res.status(404).send("Link de streaming vazio.");
        }
    });
});

module.exports = router;
