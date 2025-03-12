const AppConfig = require('../models/AppConfig');
const path = require('path');
const fs = require('fs').promises;
const sharp = require('sharp');

// Obtener la configuración actual
exports.getConfig = async (req, res) => {
  try {
    let config = await AppConfig.findOne();
    if (!config) {
      config = new AppConfig();
      await config.save();
    }

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

    // Actualizar color principal
    if (colors && colors.primary) {
      config.colors.primary = colors.primary;
    }

    // Actualizar nombre de la aplicación
    if (appName) {
      config.appName = appName;
    }

    // Manejar la subida del logo si existe
    if (req.file) {
      const uploadDir = path.join(__dirname, '../../public/uploads/logos');
      
      // Crear directorio si no existe
      try {
        await fs.mkdir(uploadDir, { recursive: true });
      } catch (err) {
        if (err.code !== 'EEXIST') throw err;
      }

      // Si hay un logo anterior, eliminarlo
      if (config.logo.url) {
        const oldLogoPath = path.join(__dirname, '../../public', config.logo.url);
        try {
          await fs.unlink(oldLogoPath);
        } catch (err) {
          console.error('Error al eliminar logo anterior:', err);
        }
      }

      // Procesar y optimizar la imagen para favicon
      const filename = `logo-${Date.now()}`;
      const logoPath = `/uploads/logos/${filename}.png`;
      
      await sharp(req.file.path)
        .resize(192, 192) // Tamaño recomendado para favicon
        .png() // Convertir a PNG para mejor compatibilidad
        .toFile(path.join(__dirname, '../../public', logoPath));

      // Eliminar el archivo temporal
      await fs.unlink(req.file.path);

      // Guardar nuevo logo
      config.logo = {
        url: logoPath,
        altText: appName || config.appName,
        width: 40
      };
    }

    // Actualizar información de modificación
    config.lastModified = new Date();
    config.lastModifiedBy = req.user._id;

    await config.save();

    // Generar CSS personalizado
    await generateCustomCSS(config);

    req.flash('mensajeExito', 'Configuración actualizada correctamente');
    res.redirect('/admin/config');
  } catch (error) {
    console.error('Error al actualizar configuración:', error);
    req.flash('mensajeError', 'Error al actualizar la configuración');
    res.redirect('/admin/config');
  }
};

// Función para generar CSS personalizado
async function generateCustomCSS(config) {
  try {
    const cssContent = `
/* Estilos personalizados generados automáticamente */
:root {
  --primary-color: ${config.colors.primary};
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
  box-shadow: 0 0 0 0.25rem rgba(var(--primary-color), 0.25);
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
  } catch (error) {
    console.error('Error al generar CSS personalizado:', error);
    throw error;
  }
} 