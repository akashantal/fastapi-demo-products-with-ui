FROM node:18-slim

WORKDIR /app

# Copy package.json first (for caching)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy rest of code
COPY . .

# Build frontend
RUN npm run build

# Expose port
EXPOSE 80

# Serve
CMD ["npx", "serve", "-s", "build", "-l", "80"]
