const AppConfig = require('../models/AppConfig');
const path = require('path');
const fs = require('fs').promises;
const sharp = require('sharp');

// Constantes para rutas de almacenamiento
const STORAGE_PATH = path.join(__dirname, '../../storage/app/logos');
const PUBLIC_LOGOS_PATH = path.join(__dirname, '../../public/uploads/logos');

// Función para asegurar que los directorios existan
async function ensureDirectories() {
  try {
    await fs.mkdir(STORAGE_PATH, { recursive: true });
    await fs.mkdir(PUBLIC_LOGOS_PATH, { recursive: true });
  } catch (error) {
    console.error('Error al crear directorios:', error);
  }
}

// Función para copiar logo al directorio público
async function copyLogoToPublic(storagePath, filename) {
  try {
    const publicPath = path.join(PUBLIC_LOGOS_PATH, filename);
    await fs.copyFile(storagePath, publicPath);
    return `/uploads/logos/${filename}`;
  } catch (error) {
    console.error('Error al copiar logo a public:', error);
    throw error;
  }
}

// Función para restaurar logos desde storage al iniciar la aplicación
async function restoreLogosFromStorage() {
  try {
    const config = await AppConfig.findOne();
    if (config && config.logo && config.logo.filename) {
      const storagePath = path.join(STORAGE_PATH, config.logo.filename);
      const exists = await fs.access(storagePath).then(() => true).catch(() => false);
      
      if (exists) {
        await copyLogoToPublic(storagePath, config.logo.filename);
      }
    }
  } catch (error) {
    console.error('Error al restaurar logos:', error);
  }
}

// Llamar a la función al iniciar la aplicación
ensureDirectories().then(() => restoreLogosFromStorage());

// Función para convertir color HEX a RGB
function hexToRgb(hex) {
  // Remover el # si existe
  hex = hex.replace('#', '');
  
  // Convertir a RGB
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  return [r, g, b];
}

// Función para generar CSS personalizado
async function generateCustomCSS(config) {
  try {
    const primaryColor = config.colors.primary;
    const [r, g, b] = hexToRgb(primaryColor);
    
    const cssContent = `
/* Estilos personalizados generados automáticamente */
:root {
  --primary-color: ${primaryColor};
  --primary-rgb: ${r}, ${g}, ${b};
}

.btn-primary {
  background-color: var(--primary-color) !important;
  border-color: var(--primary-color) !important;
}

.btn-outline-primary {
  color: var(--primary-color) !important;
  border-color: var(--primary-color) !important;
}

.btn-outline-primary:hover {
  background-color: var(--primary-color) !important;
  color: white !important;
}

/* Otros estilos personalizados */
.bg-primary {
  background-color: var(--primary-color) !important;
}

.text-primary {
  color: var(--primary-color) !important;
}

.border-primary {
  border-color: var(--primary-color) !important;
}

/* Enlaces */
a {
  color: var(--primary-color);
}

a:hover {
  color: var(--primary-color);
  opacity: 0.8;
}

/* Elementos de formulario */
.form-control:focus {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 0.25rem rgba(var(--primary-rgb), 0.25);
}

/* Dropdown */
.dropdown-item:active {
  background-color: var(--primary-color);
}

/* Paginación */
.page-link {
  color: var(--primary-color);
}

.page-item.active .page-link {
  background-color: var(--primary-color);
  border-color: var(--primary-color);
}

/* Progress bars */
.progress-bar {
  background-color: var(--primary-color);
}

/* List groups */
.list-group-item.active {
  background-color: var(--primary-color);
  border-color: var(--primary-color);
}`;

    const cssPath = path.join(__dirname, '../../public/css/custom.css');
    await fs.writeFile(cssPath, cssContent);

    // Crear un archivo de respaldo con la última configuración
    const configBackupPath = path.join(STORAGE_PATH, 'config-backup.json');
    await fs.writeFile(configBackupPath, JSON.stringify({
      colors: config.colors,
      logo: config.logo,
      timestamp: new Date().toISOString()
    }, null, 2));
  } catch (error) {
    console.error('Error al generar CSS personalizado:', error);
    throw error;
  }
}

// Obtener la configuración actual
exports.getConfig = async (req, res) => {
  try {
    let config = await AppConfig.findOne();
    if (!config) {
      config = new AppConfig();
      await config.save();
    }

    // Regenerar CSS por si acaso
    await generateCustomCSS(config);

    res.render('admin/config', {
      config,
      mensajeExito: req.flash('mensajeExito'),
      mensajeError: req.flash('mensajeError')
    });
  } catch (error) {
    console.error('Error al obtener configuración:', error);
    req.flash('mensajeError', 'Error al cargar la configuración');
    res.redirect('/dashboard');
  }
};

// Actualizar la configuración
exports.updateConfig = async (req, res) => {
  try {
    const { colors, appName } = req.body;
    let config = await AppConfig.findOne();
    
    if (!config) {
      config = new AppConfig();
    }

    // Validar y actualizar color principal
    if (colors && colors.primary) {
      const colorRegex = /^#[0-9A-Fa-f]{6}$/;
      if (!colorRegex.test(colors.primary)) {
        throw new Error('Color inválido');
      }
      config.colors.primary = colors.primary;
    }

    // Actualizar nombre de la aplicación
    if (appName) {
      config.appName = appName;
    }

    // Manejar la subida del logo si existe
    if (req.file) {
      // Generar nombre de archivo único
      const filename = `logo-${Date.now()}.png`;
      const storagePath = path.join(STORAGE_PATH, filename);
      
      // Procesar y optimizar la imagen
      await sharp(req.file.path)
        .resize(192, 192)
        .png()
        .toFile(storagePath);

      // Copiar al directorio público
      const publicUrl = await copyLogoToPublic(storagePath, filename);

      // Si hay un logo anterior, eliminarlo
      if (config.logo && config.logo.filename) {
        const oldStoragePath = path.join(STORAGE_PATH, config.logo.filename);
        const oldPublicPath = path.join(PUBLIC_LOGOS_PATH, config.logo.filename);
        try {
          await fs.unlink(oldStoragePath);
          await fs.unlink(oldPublicPath);
        } catch (err) {
          console.error('Error al eliminar logo anterior:', err);
        }
      }

      // Actualizar configuración
      config.logo = {
        url: publicUrl,
        filename: filename,
        altText: appName || config.appName,
        width: 40
      };

      // Eliminar el archivo temporal
      await fs.unlink(req.file.path);
    }

    // Actualizar información de modificación
    config.lastModified = new Date();
    config.lastModifiedBy = req.user._id;

    await config.save();

    // Generar CSS personalizado
    await generateCustomCSS(config);

    // Crear respaldo de la configuración
    const configBackupPath = path.join(STORAGE_PATH, 'config-backup.json');
    await fs.writeFile(configBackupPath, JSON.stringify({
      colors: config.colors,
      logo: config.logo,
      timestamp: new Date().toISOString()
    }, null, 2));

    // Forzar recarga del CSS en el cliente
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    req.flash('mensajeExito', 'Configuración actualizada correctamente');
    res.redirect('/admin/config');
  } catch (error) {
    console.error('Error al actualizar configuración:', error);
    req.flash('mensajeError', error.message || 'Error al actualizar la configuración');
    res.redirect('/admin/config');
  }
}; 