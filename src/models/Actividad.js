const mongoose = require('mongoose');

const actividadSchema = new mongoose.Schema({
  usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  tipo: {
    type: String,
    required: true,
    enum: ['entrenamiento', 'logro', 'nivel', 'torneo']
  },
  mensaje: {
    type: String,
    required: true
  },
  entidadId: {
    type: mongoose.Schema.Types.ObjectId,
    required: false,
    refPath: 'entidadModelo'
  },
  entidadModelo: {
    type: String,
    required: false,
    enum: ['Entrenamiento', 'Logro', 'User', 'Torneo']
  },
  fecha: {
    type: Date,
    default: Date.now
  },
  icono: {
    type: String,
    default: 'fa-bell'
  },
  color: {
    type: String,
    default: 'primary'
  },
  metadatos: {
    entrenamiento: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Entrenamiento'
    },
    logro: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Logro'
    },
    nivel: Number,
    promedio: Number,
    puntaje: Number
  },
  reacciones: [{
    usuario: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    tipo: {
      type: String,
      enum: ['like', 'aplausos', 'impresionado']
    }
  }],
  comentarios: [{
    usuario: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    texto: String,
    fecha: {
      type: Date,
      default: Date.now
    }
  }]
});

// Índice para mejorar la velocidad de búsqueda por fecha
actividadSchema.index({ fecha: -1 });

const Actividad = mongoose.model('Actividad', actividadSchema);

module.exports = Actividad; 