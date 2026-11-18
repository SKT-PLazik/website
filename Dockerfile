# syntax=docker/dockerfile:1

# Build the JS on the host platform; it runs on any target architecture.
ARG BUILDPLATFORM=linux/amd64

FROM --platform=$BUILDPLATFORM oven/bun:1.4.4-alpine AS build
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile
COPY . .
RUN bun run build

FROM gcr.io/distroless/nodejs24-debian12:nonroot
COPY --from=build /app/dist /app/dist
COPY --from=build /app/node_modules /app/node_modules
COPY --from=build /app/package.json /app/package.json
ENV HOST=0.0.0.0 PORT=8080 NODE_ENV=production HOME=/tmp
WORKDIR /tmp
EXPOSE 8080
USER nonroot:nonroot
CMD ["/app/dist/server/entry.mjs"]
