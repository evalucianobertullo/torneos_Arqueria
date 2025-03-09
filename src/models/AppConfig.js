const mongoose = require('mongoose');

const appConfigSchema = new mongoose.Schema({
  // Configuración del logo
  logo: {
    url: {
      type: String,
      default: ''
    },
    altText: {
      type: String,
      default: 'Torneos de Arquería'
    },
    width: {
      type: Number,
      default: 40
    }
  },
  // Colores principales
  colors: {
    navbar: {
      type: String,
      default: '#0d6efd' // Color Bootstrap primary por defecto
    },
    primary: {
      type: String,
      default: '#0d6efd'
    },
    secondary: {
      type: String,
      default: '#6c757d'
    },
    success: {
      type: String,
      default: '#198754'
    },
    warning: {
      type: String,
      default: '#ffc107'
    }
  },
  // Otras configuraciones de estilo
  styles: {
    cardBorderRadius: {
      type: String,
      default: '10px'
    },
    buttonBorderRadius: {
      type: String,
      default: '5px'
    }
  },
  // Configuración de la aplicación
  appName: {
    type: String,
    default: 'Torneos de Arquería'
  },
  // Fecha de última modificación
  lastModified: {
    type: Date,
    default: Date.now
  },
  // Usuario que realizó la última modificación
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
});

const AppConfig = mongoose.model('AppConfig', appConfigSchema);

module.exports = AppConfig; 