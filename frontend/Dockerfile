# =========================
# 1. Base Stage (Shared)
# =========================
FROM node:20-slim AS base
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