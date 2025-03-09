const mongoose = require('mongoose');

const logroSchema = new mongoose.Schema({
  titulo: {
    type: String,
    required: true,
    trim: true
  },
  descripcion: {
    type: String,
    required: true,
    trim: true
  },
  icono: {
    type: String,
    required: true,
    trim: true
  },
  tipo: {
    type: String,
    required: true,
    enum: ['entrenamiento', 'puntaje', 'consistencia', 'experiencia'],
    default: 'entrenamiento'
  },
  requisito: {
    type: Number,
    required: true
  },
  nivel: {
    type: Number,
    default: 1
  },
  puntos_exp: {
    type: Number,
    default: 10
  },
  fecha_creacion: {
    type: Date,
    default: Date.now
  }
});

const Logro = mongoose.model('Logro', logroSchema);

module.exports = Logro; 