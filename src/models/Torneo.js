const mongoose = require('mongoose');

const TorneoSchema = new mongoose.Schema({
  nombre: {
    type: String,
    default: 'Torneo',
    required: true,
    trim: true
  },
  fecha: {
    type: Date,
    default: Date.now,
    required: true
  },
  distancia: {
    type: String,
    enum: ['5m', '10m', '18m', '30m', '70m'],
    default: '18m',
    required: true
  },
  flechasPorTirada: {
    type: Number,
    required: true,
    min: 1
  },
  rondas: {
    type: Number,
    required: true,
    min: 1
  },
  creador: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  participantes: [{
    usuario: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    estado: {
      type: String,
      enum: ['pendiente', 'aceptado', 'rechazado'],
      default: 'pendiente'
    },
    puntuacion: {
      type: Number,
      default: 0
    },
    tiradas: [{
      ronda: Number,
      puntos: [Number], // Array con la puntuación de cada flecha
      total: Number,    // Total de puntos en esta tirada
      registradoPor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      createdAt: {
        type: Date,
        default: Date.now
      }
    }],
    fechaRegistro: {
      type: Date,
      default: Date.now
    }
  }],
  estado: {
    type: String,
    enum: ['preparacion', 'activo', 'finalizado'],
    default: 'preparacion'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Método para verificar si un usuario es el creador
TorneoSchema.methods.esCreador = function(usuarioId) {
  return this.creador.toString() === usuarioId.toString();
};

// Método para verificar si un usuario es participante
TorneoSchema.methods.esParticipante = function(usuarioId) {
  if (!usuarioId) return false;
  
  // Asegurarse de que estamos comparando strings con strings
  const usuarioIdStr = usuarioId.toString();
  
  return this.participantes.some(p => 
    p.usuario && p.usuario.toString() === usuarioIdStr && 
    p.estado === 'aceptado'
  );
};

// Método para agregar un participante
TorneoSchema.methods.agregarParticipante = function(usuarioId) {
  // Verificar si el usuario ya es participante
  const participanteExistente = this.participantes.find(p => 
    p.usuario && p.usuario.toString() === usuarioId.toString()
  );

  if (participanteExistente) {
    return false;
  }

  // Agregar al usuario como participante
  this.participantes.push({
    usuario: usuarioId,
    estado: 'aceptado',
    puntuacion: 0,
    tiradas: []
  });

  return true;
};

// Calcular puntuación total para todos los participantes
TorneoSchema.methods.calcularPuntuaciones = function() {
  this.participantes.forEach(participante => {
    let puntuacionTotal = 0;
    
    participante.tiradas.forEach(tirada => {
      puntuacionTotal += tirada.total || 0;
    });
    
    participante.puntuacion = puntuacionTotal;
  });
};

module.exports = mongoose.model('Torneo', TorneoSchema); 