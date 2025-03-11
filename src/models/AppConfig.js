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
  // Color principal
  colors: {
    primary: {
      type: String,
      default: '#0d6efd'
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