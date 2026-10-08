FROM node:20-alpine AS build
WORKDIR /workspace
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY apps/mobile/package.json apps/mobile/package.json
COPY packages/shared/package.json packages/shared/package.json
RUN npm ci --workspace=@waypoint/web --workspace=@waypoint/shared
COPY apps/web apps/web
ARG VITE_API_URL=http://localhost:4000
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build --workspace=@waypoint/web

FROM nginx:alpine
COPY --from=build /workspace/apps/web/dist /usr/share/nginx/html
EXPOSE 80
