FROM oven/bun:1-alpine
WORKDIR /app

RUN apk add --no-cache curl

RUN addgroup -g 1001 -S appgroup && adduser -S appuser -u 1001

COPY --chown=appuser:appgroup package.json bun.lock bunfig.toml ./
COPY --chown=appuser:appgroup api/package.json ./api/package.json
COPY --chown=appuser:appgroup ui/package.json ./ui/package.json

RUN bun install --frozen-lockfile --ignore-scripts

COPY --chown=appuser:appgroup . .

RUN bun run postinstall

RUN mkdir -p .bos/generated .bos/logs && \
    chown -R appuser:appgroup .bos && \
    chown appuser:appgroup /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0
# BOS_ENV: set to "staging" to enable staging mode (uses staging domain for BOS_GATEWAY)
# Defaults to "production" if unset.
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

USER appuser
CMD ["sh", "-c", "node_modules/.bin/bos start --no-interactive"]
