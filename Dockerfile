# -------------------------
# 1) Dependencies
# -------------------------
FROM node:20-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

# -------------------------
# 2) Build
# -------------------------
FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build

# -------------------------
# 3) Production Dependencies
# -------------------------
FROM node:20-alpine AS deps_prod
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# -------------------------
# 4) Runner
# -------------------------
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json
# Solo copiamos las dependencias de producción, ignorando ESLint, TypeScript, etc.
COPY --from=deps_prod /app/node_modules ./node_modules

EXPOSE 3000

CMD ["node", "dist/main.js"]