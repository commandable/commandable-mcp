FROM node:22-slim

WORKDIR /app

# Install runtime deps for the server/CLI
COPY package.json ./
RUN npm install --omit=dev

# Runtime artifacts
COPY dist/ dist/
COPY integration-data/ integration-data/

ENV PORT=3000
EXPOSE 3000

CMD ["node", "dist/cli/bin.js", "serve"]

