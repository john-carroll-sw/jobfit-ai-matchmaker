# Stage 1: Build the React application
FROM mcr.microsoft.com/vscode/devcontainers/javascript-node:22-bookworm AS builder

# Set working directory
WORKDIR /app

# Copy package.json and yarn.lock
COPY package.json yarn.lock ./

# Install project dependencies
RUN yarn install

# Copy the rest of the application code
COPY . .

# Build the application
RUN yarn build

# Stage 2: Serve the application with NGINX
FROM mcr.microsoft.com/azurelinux/base/nginx:1.25

# Copy the built files from the previous stage
COPY --from=builder /app/build /usr/share/nginx/html

#https://mcr.microsoft.com/en-us/artifact/mar/azurelinux/base/nginx/about
COPY /nginx-custom.conf /etc/nginx/nginx.conf.default

COPY env.sh /docker-entrypoint.d/env.sh
RUN chmod +x /docker-entrypoint.d/env.sh
RUN sed -i 's/\r$//' /docker-entrypoint.d/env.sh

# Expose the application port
EXPOSE 3000

# Start NGINX and run env.sh
CMD ["/bin/sh", "-c", "/docker-entrypoint.d/env.sh && nginx -g 'daemon off;'"]
