# Torneos de Arquería

Aplicación web para la gestión de torneos de arquería, optimizada para dispositivos móviles.

## Características

- Sistema de autenticación de usuarios (arqueros)
- Gestión de usuarios con roles de administrador
- Creación y gestión de torneos
- Registro de participantes en torneos
- Desarrollo de torneos con registro de tiradas
- Resultados y clasificación automática

## Requisitos

- Node.js (v14 o superior)
- MongoDB (v4 o superior)

## Instalación

1. Clonar el repositorio:
```
git clone <url-del-repositorio>
cd torneos_arqueria
```

2. Instalar dependencias:
```
npm install
```

3. Configurar variables de entorno:
Crear un archivo `.env` en la raíz del proyecto con el siguiente contenido:
```
PORT=3000
MONGO_URI=mongodb://localhost:27017/torneos_arqueria
SESSION_SECRET=tu_clave_secreta
```

4. Iniciar la aplicación:
```
npm start
```

## Uso

1. Acceder a la aplicación en `http://localhost:3000`
2. Registrarse como nuevo usuario
3. El primer usuario registrado será automáticamente administrador

## Desarrollo

Para ejecutar la aplicación en modo desarrollo con recarga automática:
```
npm run dev
```

## Estructura del Proyecto

- `src/` - Código fuente de la aplicación
  - `config/` - Configuraciones (base de datos, passport)
  - `controllers/` - Controladores
  - `middleware/` - Middleware personalizado
  - `models/` - Modelos de datos
  - `routes/` - Rutas de la aplicación
- `public/` - Archivos estáticos (CSS, JavaScript, imágenes)
- `views/` - Plantillas EJS

## Licencia

Este proyecto está licenciado bajo la Licencia MIT. 