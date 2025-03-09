const mongoose = require('mongoose');

// Esquema para las tiradas dentro de un entrenamiento
const tiradaSchema = new mongoose.Schema({
  ronda: {
    type: Number,
    required: true
  },
  puntos: [Number],
  total: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Esquema principal para el entrenamiento
const entrenamientoSchema = new mongoose.Schema({
  nombre: {
    type: String,
    default: 'Entrenamiento',
    required: true
  },
  fecha: {
    type: Date,
    default: Date.now,
    required: true
  },
  usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  flechasPorTirada: {
    type: Number,
    required: true,
    min: 1,
    max: 12
  },
  rondas: {
    type: Number,
    required: true,
    min: 1,
    max: 20
  },
  distancia: {
    type: String,
    required: true,
    enum: ['5m', '10m', '18m', '25m', '30m', '50m', '70m']
  },
  estado: {
    type: String,
    enum: ['activo', 'finalizado'],
    default: 'activo'
  },
  tiradas: [tiradaSchema],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Método virtual para calcular la puntuación total
entrenamientoSchema.virtual('puntuacionTotal').get(function() {
  return this.tiradas.reduce((total, tirada) => total + tirada.total, 0);
});

// Método virtual para calcular el promedio por ronda
entrenamientoSchema.virtual('promedioPorRonda').get(function() {
  if (this.tiradas.length === 0) return 0;
  return this.puntuacionTotal / this.tiradas.length;
});

// Método virtual para calcular el promedio por flecha
entrenamientoSchema.virtual('promedioPorFlecha').get(function() {
  const totalFlechas = this.tiradas.reduce((total, tirada) => total + tirada.puntos.length, 0);
  if (totalFlechas === 0) return 0;
  return this.puntuacionTotal / totalFlechas;
});

// Exportar el modelo
const Entrenamiento = mongoose.model('Entrenamiento', entrenamientoSchema);
module.exports = Entrenamiento; 