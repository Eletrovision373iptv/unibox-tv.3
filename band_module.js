const express = require('express');
const { spawn } = require('child_process');
const fs = require('fs');
const router = express.Router();

const FFMPEG = 'ffmpeg';
const YT_DLP = 'yt-dlp';
const linkCache = {};
const pendingFetch = {};
const CACHE_TTL_MS = 15 * 60 * 1000;
const usuariosOnline = {};

router.get('/', (req, res) => {
    try {
        const channels = JSON.parse(fs.readFileSync('./ids_band.json', 'utf8'));
        const host = req.get('host');
        const token = process.env.AUTH_TOKEN || 'unibox';
        const baseUrl = req.baseUrl;

        let html = `<!DOCTYPE html>
        <html lang="pt-br">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>UNIBOX - BAND</title>
            <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
            <style>
                body { background: #1a1a00; color: #fff; font-family: sans-serif; }
                .topo { background: #333300; padding: 15px 0; margin-bottom: 20px; border-bottom: 3px solid #ffff00; }
                .card { background: #2b2b00; border: 1px solid #444; transition: 0.3s; color: #fff; }
                .card:hover { border-color: #ffff00; transform: translateY(-5px); }
                .card-title { font-size: 0.9rem; font-weight: bold; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 5px; }
                .online { font-size: 0.75rem; color: #ffff00; margin-bottom: 10px; }
                .btn-watch { background: #e6e600; color: #000; width: 100%; font-weight: bold; margin-bottom: 5px; border: none; }
                .btn-watch:hover { background: #cccc00; color: #000; }
            </style>
        </head>
        <body>
        <div class="topo"><div class="container d-flex justify-content-between align-items-center">
            <h4 class="m-0">📺 UNIBOX <span style="color:#ffff00">BAND</span></h4>
            <a href="${baseUrl}/baixar-m3u" class="btn btn-success fw-bold btn-sm">M3U</a>
        </div></div>
        <div class="container pb-5"><div class="row g-2">
            ${channels.map((ch, i) => {
                const link = `http://${host}${baseUrl}/live/${token}/${i}.ts`;
                return `<div class="col-6 col-md-4 col-lg-2"><div class="card p-2 text-center h-100">
                    <img src="${ch.logo}" class="img-fluid rounded mb-2" style="max-height:80px;object-fit:contain;">
                    <div class="card-body p-0 pt-2">
                        <div class="card-title">${ch.nome}</div>
                        <div class="online">● ${usuariosOnline[i] || 0} ON</div>
                        <a href="${link}" target="_blank" class="btn btn-watch">ASSISTIR</a>
                    </div>
                </div></div>`;
            }).join('')}
        </div></div>
        </body></html>`;
        res.send(html);
    } catch (e) { res.status(500).send(e.message); }
});

router.get('/baixar-m3u', (req, res) => {
    try {
        const canais = JSON.parse(fs.readFileSync('./ids_band.json', 'utf8'));
        const token = process.env.AUTH_TOKEN || 'unibox';
        const host = req.get('host');
        const baseUrl = req.baseUrl;
        let m3u = "#EXTM3U\n";
        canais.forEach((ch, index) => {
            const link = `http://${host}${baseUrl}/live/${token}/${index}.ts`;
            m3u += `#EXTINF:-1 tvg-logo="${ch.logo}" group-title="Band",${ch.nome}\n${link}\n`;
        });
        res.setHeader('Content-Disposition', 'attachment; filename=band.m3u');
        res.send(m3u);
    } catch (e) { res.end(); }
});

router.get('/live/:token/:index', async (req, res) => {
    const idx = parseInt(req.params.index.split('.')[0], 10);
    res.writeHead(200, { 'Content-Type': 'video/mp2t', 'Connection': 'keep-alive', 'Access-Control-Allow-Origin': '*' });
    try {
        const canais = JSON.parse(fs.readFileSync('./ids_band.json', 'utf8'));
        const canal = canais[idx];
        if (!canal) return res.end();
        usuariosOnline[idx] = (usuariosOnline[idx] || 0) + 1;
        const cacheKey = canal.id;
        let streamUrl;
        if (linkCache[cacheKey] && (Date.now() - linkCache[cacheKey].time < CACHE_TTL_MS)) {
            streamUrl = linkCache[cacheKey].url;
        } else if (pendingFetch[cacheKey]) {
            streamUrl = await pendingFetch[cacheKey];
        } else {
            pendingFetch[cacheKey] = fetchStreamUrl(canal).then(url => {
                if (url) linkCache[cacheKey] = { url, time: Date.now() };
                delete pendingFetch[cacheKey];
                return url;
            });
            streamUrl = await pendingFetch[cacheKey];
        }
        if (!streamUrl) throw new Error("Off");
        const ff = spawn(FFMPEG, ['-i', streamUrl, '-c', 'copy', '-f', 'mpegts', 'pipe:1']);
        ff.stdout.pipe(res);
        res.on('close', () => { if (usuariosOnline[idx] > 0) usuariosOnline[idx]--; ff.kill(); });
    } catch (e) { if (usuariosOnline[idx] > 0) usuariosOnline[idx]--; res.end(); }
});

function fetchStreamUrl(canal) {
    return new Promise((resolve) => {
        const args = ['--get-url', '--format', 'best', '--no-warnings', '--extractor-args', 'generic:impersonate', canal.url];
        const child = spawn(YT_DLP, args);
        let output = '';
        child.stdout.on('data', (d) => output += d);
        child.on('close', () => resolve(output.trim().split('\n')[0] || null));
    });
}

module.exports = router;
