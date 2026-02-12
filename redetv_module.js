// Comando simplificado sem o "impersonate" que está dando erro
    const command = `/usr/local/bin/yt-dlp -g --no-check-certificates "${targetUrl}"`;

    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error(`❌ Erro yt-dlp RedeTV: ${error.message}`);
            // Se o erro persistir, vamos tentar um log mais detalhado
            console.error(`Stderr: ${stderr}`);
            return res.status(500).send("O servidor não conseguiu extrair o vídeo. Pode ser bloqueio regional.");
        }

        const streamUrl = stdout.trim();
        // ... resto do código igual
