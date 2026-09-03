# Frontend Dockerfile
# Stage 1: Build the React app
FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Create temporary variable only available during Docker build the image
ARG VITE_API_BASE_URL=http://localhost:5000/api
# Persist inside the final image as an environment variable
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

RUN npm run build

# Stage 2: Serve the React app with Nginx
FROM nginx:1.27-alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \ 
CMD wget -qO- http://localhost/80 || exit 1

CMD ["nginx", "-g", "daemon off;"]