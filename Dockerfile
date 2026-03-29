FROM node:20-alpine AS base

# 1. Install OpenSSL - Prisma needs this to talk to the DB
RUN apk add --no-cache openssl

FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci || npm install

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# 2. Add a dummy key for build-time only
# This prevents the Resend "Missing API key" crash
ENV RESEND_API_KEY="re_dummy_key_for_build"
ENV NEXT_PUBLIC_SITE_URL="https://wiffplus.com"

RUN npx prisma generate
RUN npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV production

COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000
CMD ["npm", "start"]
