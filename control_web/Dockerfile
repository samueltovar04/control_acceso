# --- STAGE 1: Build Angular Frontend ---
FROM node:20-alpine AS build
WORKDIR /app

COPY src/main/web/package.json ./
RUN npm install --legacy-peer-deps

COPY src/main/web/ ./
RUN npx ng build --configuration production

# --- STAGE 2: Serve with Nginx ---
FROM nginx:alpine
COPY --from=build /app/dist/control-acceso-web/browser/ /usr/share/nginx/html/
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
