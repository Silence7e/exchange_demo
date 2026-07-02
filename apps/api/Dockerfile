# syntax=docker/dockerfile:1

FROM node:20-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

FROM base AS builder
WORKDIR /app
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm turbo prune @exchange/api --docker

FROM base AS build
WORKDIR /app
COPY --from=builder /app/out/json/ .
COPY --from=builder /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
RUN pnpm install --frozen-lockfile
COPY --from=builder /app/out/full/ .
COPY --from=builder /app/tsconfig.base.json ./tsconfig.base.json
RUN pnpm --filter @exchange/api exec prisma generate
RUN pnpm turbo build --filter=@exchange/api
RUN pnpm deploy --filter @exchange/api --prod /prod/api

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 --ingroup nodejs nestjs

COPY --from=build --chown=nestjs:nodejs /prod/api ./

USER nestjs
EXPOSE 4000

CMD ["node", "dist/main.js"]

FROM build AS migrator
WORKDIR /app
ENTRYPOINT ["pnpm", "--filter", "@exchange/api", "exec", "prisma", "migrate", "deploy"]
