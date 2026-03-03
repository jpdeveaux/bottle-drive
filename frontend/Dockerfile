FROM node:25-slim

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Vite's default dev port
EXPOSE 5173

# We use --host to ensure Vite listens to the Docker network
CMD ["npm", "run", "dev", "--", "--host"]