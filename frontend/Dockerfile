# =========================
# 1. Base Stage (Shared)
# =========================
FROM node:22-slim AS base
WORKDIR /app
COPY package*.json ./
RUN npm install

# =========================
# 2. Development Target
# =========================
# Use this for local coding with Vite's dev server
FROM base AS dev
COPY . .
EXPOSE 5173
# --host is required for Docker to map the port to your Windows machine
CMD ["npm", "run", "dev", "--", "--host"]

# =========================
# 3. Builder Stage
# =========================
# This temporary stage compiles the code and creates the /dist folder
FROM base AS builder
COPY . .

# Declare build args
ARG VITE_TITLE
ARG VITE_DATE_TIME
ARG VITE_API_URL
ARG VITE_MAP_CENTER_LAT
ARG VITE_MAP_CENTER_LNG
ARG VITE_MAP_ZOOM
ARG VITE_ADDRESS_PLACEHOLDER
ARG VITE_RECAPTCHA_SITE_KEY
ARG GOOGLE_CLIENT_ID

# expose build args as environment variables for Vite
ENV VITE_TITLE=$VITE_TITLE
ENV VITE_DATE_TIME=$VITE_DATE_TIME
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_MAP_CENTER_LAT=$VITE_MAP_CENTER_LAT
ENV VITE_MAP_CENTER_LNG=$VITE_MAP_CENTER_LNG
ENV VITE_MAP_ZOOM=$VITE_MAP_ZOOM
ENV VITE_ADDRESS_PLACEHOLDER$=$VITE_ADDRESS_PLACEHOLDER
ENV VITE_RECAPTCHA_SITE_KEY=$VITE_RECAPTCHA_SITE_KEY
ENV VITE_GOOGLE_CLIENT_ID=$GOOGLE_CLIENT_ID

# If 'tsc -b' fails, this build will stop here
RUN npm run build

# =========================
# 4. Production Target
# =========================
# This is the final standalone image. It contains NO Node.js.
# It only contains Nginx and your minified files.
FROM nginx:alpine AS production

RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy the compiled 'dist' folder from the builder stage
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]