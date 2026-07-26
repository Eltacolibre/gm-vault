# ---- build the React client ----
FROM node:22-bookworm-slim AS client
WORKDIR /build/client
COPY client/package.json client/package-lock.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

# ---- build the Express server ----
FROM node:22-bookworm-slim AS server
WORKDIR /build/server
COPY server/package.json server/package-lock.json ./
RUN npm ci
COPY server/ ./
RUN npm run build && npm prune --omit=dev

# ---- runtime ----
FROM node:22-bookworm-slim
ENV NODE_ENV=production \
    PORT=8580 \
    DB_PATH=/data/gmvault.db \
    CLIENT_DIR=/app/client/dist
WORKDIR /app/server
COPY --from=server /build/server/node_modules ./node_modules
COPY --from=server /build/server/dist ./dist
COPY --from=server /build/server/package.json ./
COPY --from=client /build/client/dist /app/client/dist
VOLUME /data
EXPOSE 8580
CMD ["node", "dist/index.js"]
