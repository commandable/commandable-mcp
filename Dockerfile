FROM node:22-slim

WORKDIR /app

# Install deps (workspace-aware)
COPY package.json yarn.lock tsconfig.base.json ./
COPY packages/server/package.json packages/server/package.json
COPY app/package.json app/package.json

RUN corepack enable \
  && corepack prepare yarn@4.12.0 --activate \
  && yarn install --frozen-lockfile

# Copy source and build
COPY . .
RUN yarn build

ENV NODE_ENV=production
ENV PORT=3000
ENV COMMANDABLE_INTEGRATION_DATA_DIR=/app/packages/server/integration-data

EXPOSE 3000

CMD ["node", "app/.output/server/index.mjs"]

