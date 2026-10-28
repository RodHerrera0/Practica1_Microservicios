# Dockerfile del microservicio BILLETERA. Mismo patrón que catalogo y biblioteca.
FROM node:22-alpine
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 4003
CMD ["node", "src/server.js"]
