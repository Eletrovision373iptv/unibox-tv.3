FROM node:22-slim

# Instalar dependências do sistema (FFmpeg e Python para yt-dlp)
RUN apt-get update && apt-get install -y \
    ffmpeg \
    python3 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Instalar yt-dlp
RUN curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp \
    && chmod a+rx /usr/local/bin/yt-dlp

WORKDIR /app

# Copiar arquivos de dependências
COPY package.json ./

# Instalar dependências do Node
RUN npm install

# Copiar o restante dos arquivos
COPY . .

# Expor as portas
EXPOSE 3000 3001

# Comando para iniciar (usando um script simples ou node direto)
CMD ["node", "server.js"]
