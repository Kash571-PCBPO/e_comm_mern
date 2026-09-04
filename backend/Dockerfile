# Backend Dockerfile
FROM node:20-alpine

WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./
RUN npm install --omit=dev

# Copy application source
COPY src ./src

ENV NODE_ENV=production
EXPOSE 5000

USER node

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
CMD wget -qO- http://localhost:5000/api/health || exit 1

CMD ["node", "src/server.js"]