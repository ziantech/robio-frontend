# ---------- Stage 1: Build the Next.js app ----------
FROM node:18-alpine AS builder

WORKDIR /app

# Install dependencies (using package-lock + legacy peer deps)
COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps

# Copy the rest of the app
COPY . .

# Build Next.js
RUN npm run build

# ---------- Stage 2: Run the app ----------
FROM node:18-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV NEXT_TELEMETRY_DISABLED=1

# Install only production dependencies, same peer behavior
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --legacy-peer-deps

# Copy built app from builder
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

EXPOSE 3000

CMD ["npm", "run", "start"]
