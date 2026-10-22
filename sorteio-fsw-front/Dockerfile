# ---- build ----
FROM node:24-alpine AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY package.json package-lock.json ./
RUN npm install --no-audit --no-fund
COPY . .
# Baixa as fontes do Google Fonts (next/font) nesta etapa: depois, o site não depende de nenhum domínio externo.
RUN npm run build

# ---- runtime (Next "standalone") ----
FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    NEXT_TELEMETRY_DISABLED=1 \
    TZ=America/Sao_Paulo
# Endereço do backend, lido a cada requisição: pode ser trocado no compose sem refazer a imagem.
ENV BACKEND_URL=http://backend:8080
RUN addgroup -S app && adduser -S app -G app
COPY --from=builder --chown=app:app /app/.next/standalone ./
COPY --from=builder --chown=app:app /app/.next/static ./.next/static
COPY --from=builder --chown=app:app /app/public ./public
USER app
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/admin/login >/dev/null || exit 1
CMD ["node", "server.js"]
