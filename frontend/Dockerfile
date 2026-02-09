FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

RUN npm install

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Expose port
EXPOSE 5173

# Start command will be overridden by docker-compose
CMD ["npm", "run", "dev", "--", "--host"]
