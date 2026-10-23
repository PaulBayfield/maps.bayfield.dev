FROM node:24-alpine AS base

# Next.js app lives here
WORKDIR /app

# Set production environment
ENV NODE_ENV="production"

# Set build-time variables as environment variables
ARG NEXT_PUBLIC_APP_ADMIN_EMAIL
ENV NEXT_PUBLIC_APP_ADMIN_EMAIL=${NEXT_PUBLIC_APP_ADMIN_EMAIL}

# Throw-away build stage to reduce size of final image
FROM base AS build

# Install packages needed to build node modules
RUN apk add --no-cache build-base pkgconfig python3

# Install node modules
COPY --link package-lock.json package.json ./
RUN npm ci --include=dev --force

# Copy application code
COPY --link . .

# Build application
RUN npm run build

# Remove development dependencies
RUN npm prune --omit=dev --force

FROM base AS run

# Copy standalone app
COPY --from=build /app/.next/standalone /app
COPY --from=build /app/.next/static /app/.next/static
COPY --from=build /app/public /app/public

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Run the app
CMD [ "node", "server.js" ]
