FROM node:22-slim

WORKDIR /app

# Native deps (better-sqlite3) need a build toolchain on slim images.
RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 python3-pip python3-venv make g++ \
  && rm -rf /var/lib/apt/lists/*

ENV VIRTUAL_ENV=/opt/commandable-venv
ENV PATH="$VIRTUAL_ENV/bin:$PATH"

RUN python3 -m venv "$VIRTUAL_ENV"

# Install deps (workspace-aware)
COPY package.json yarn.lock tsconfig.base.json .yarnrc.yml ./
COPY packages/core/package.json packages/core/package.json
COPY packages/connect/package.json packages/connect/package.json
COPY packages/integration-data/package.json packages/integration-data/package.json
COPY app/package.json app/package.json

RUN corepack enable \
  && corepack prepare yarn@4.12.0 --activate \
  && yarn install --frozen-lockfile

# Copy source and build
COPY . .
RUN pip install --no-cache-dir -r packages/core/src/file-extractor/requirements.txt \
  && yarn build

ENV NODE_ENV=production
ENV PORT=3000
ENV COMMANDABLE_INTEGRATION_DATA_DIR=/app/packages/integration-data/integrations

EXPOSE 3000

CMD ["node", "app/.output/server/index.mjs"]

