# ============================================================
# Stage 1 — Build
# ============================================================
FROM node:20-alpine AS builder

# Segurança: criar usuário não-root para o build
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

# Copiar arquivos de dependência primeiro (cache de camadas)
COPY package.json package-lock.json ./

# Instalação limpa e determinística
RUN npm ci --ignore-scripts

# Copiar código-fonte e compilar
COPY . .
RUN npm run build

# ============================================================
# Stage 2 — Servir com Nginx hardened
# ============================================================
FROM nginx:1.27-alpine AS production

# Remover configuração padrão e arquivos de exemplo
RUN rm -rf /etc/nginx/conf.d/default.conf /usr/share/nginx/html/*

# Copiar configuração Nginx hardened
COPY nginx.conf /etc/nginx/nginx.conf

# Copiar artefatos do build
COPY --from=builder /app/dist /usr/share/nginx/html

# Permissões para execução não-root do Nginx
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chmod -R 755 /usr/share/nginx/html && \
    mkdir -p /var/cache/nginx/client_temp && \
    mkdir -p /var/run && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    chown -R nginx:nginx /var/run && \
    touch /var/run/nginx.pid && \
    chown nginx:nginx /var/run/nginx.pid

# Executar como usuário não-root
USER nginx

EXPOSE 8080

# Health check para orquestração
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
