# -------------------------
# 1) Dependencies
# -------------------------
# Fija una versión de parche específica reciente (ej. 20.18) o asegúrate de 
# hacer 'docker pull node:20-alpine' frecuentemente para limpiar la caché.
FROM node:20.18-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

# -------------------------
# 2) Build
# -------------------------
FROM node:20.18-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build

# -------------------------
# 3) Production Dependencies
# -------------------------
FROM node:20.18-alpine AS deps_prod
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# -------------------------
# 4) Runner
# -------------------------
FROM node:20.18-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Asignar la propiedad de los archivos al usuario no-root 'node'
COPY --chown=node:node --from=builder /app/dist ./dist
COPY --chown=node:node --from=builder /app/package.json ./package.json
COPY --chown=node:node --from=deps_prod /app/node_modules ./node_modules

# Cambiar del usuario root al usuario seguro 'node' (incluido por defecto en la imagen de Node)
USER node

EXPOSE 3000

CMD ["node", "dist/main.js"]