const AppConfig = require('../models/AppConfig');
const path = require('path');
const fs = require('fs').promises;

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
    const { colors, appName, styles } = req.body;
    let config = await AppConfig.findOne();
    
    if (!config) {
      config = new AppConfig();
    }

    // Actualizar colores
    if (colors) {
      config.colors = {
        ...config.colors,
        ...colors
      };
    }

    // Actualizar nombre de la aplicación
    if (appName) {
      config.appName = appName;
    }

    // Actualizar estilos
    if (styles) {
      config.styles = {
        ...config.styles,
        ...styles
      };
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

      // Guardar nuevo logo
      const logoPath = `/uploads/logos/${req.file.filename}`;
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
  --navbar-bg: ${config.colors.navbar};
  --primary-color: ${config.colors.primary};
  --secondary-color: ${config.colors.secondary};
  --success-color: ${config.colors.success};
  --warning-color: ${config.colors.warning};
  --card-border-radius: ${config.styles.cardBorderRadius};
  --button-border-radius: ${config.styles.buttonBorderRadius};
}

.navbar {
  background-color: var(--navbar-bg) !important;
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

.card {
  border-radius: var(--card-border-radius) !important;
}

.btn {
  border-radius: var(--button-border-radius) !important;
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
`;

    const cssPath = path.join(__dirname, '../../public/css/custom.css');
    await fs.writeFile(cssPath, cssContent);
  } catch (error) {
    console.error('Error al generar CSS personalizado:', error);
    throw error;
  }
} 