# Usar una imagen base de Node.js
FROM node:16-alpine

# Crear directorio de la aplicación
WORKDIR /usr/src/app

# Copiar package.json y package-lock.json
COPY package*.json ./

# Instalar dependencias
RUN npm install

# Copiar el código fuente
COPY . .

# Exponer el puerto (asumiendo que usa el puerto 3000)
EXPOSE 3000

# Comando para iniciar la aplicación
CMD ["npm", "start"] 