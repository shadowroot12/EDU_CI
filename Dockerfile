FROM node:18-alpine

WORKDIR /app

# Copy backend files
COPY backend/package*.json ./backend/

WORKDIR /app/backend

# Install dependencies
RUN npm install

# Copy backend source
COPY backend/src ./src
COPY backend/tsconfig*.json ./
COPY backend/nest-cli.json ./

# Build the application
RUN npm run build

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "run", "start:prod"]
