FROM node:20-alpine AS build
WORKDIR /workspace
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY apps/mobile/package.json apps/mobile/package.json
COPY packages/shared/package.json packages/shared/package.json
RUN npm ci --workspace=@waypoint/api --workspace=@waypoint/shared
COPY apps/api apps/api
COPY packages/shared packages/shared
RUN npm run db:generate --workspace=@waypoint/api && npm run build --workspace=@waypoint/api

FROM node:20-alpine
WORKDIR /workspace
ENV NODE_ENV=production
COPY --from=build /workspace/node_modules ./node_modules
COPY --from=build /workspace/package.json ./package.json
COPY --from=build /workspace/apps/api ./apps/api
EXPOSE 4000
CMD ["sh", "-c", "cd apps/api && npx prisma migrate deploy && node dist/index.js"]
