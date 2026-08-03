FROM node:20-bullseye-slim AS builder

WORKDIR /app/frontend

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Serve with a lightweight server
FROM nginx:alpine
COPY --from=builder /app/frontend/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
