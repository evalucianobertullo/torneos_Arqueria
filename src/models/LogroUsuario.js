const mongoose = require('mongoose');

const logroUsuarioSchema = new mongoose.Schema({
  usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  logro: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Logro',
    required: true
  },
  fecha_desbloqueo: {
    type: Date,
    default: Date.now
  },
  leido: {
    type: Boolean,
    default: false
  }
});

// Índice compuesto para evitar duplicados
logroUsuarioSchema.index({ usuario: 1, logro: 1 }, { unique: true });

const LogroUsuario = mongoose.model('LogroUsuario', logroUsuarioSchema);

module.exports = LogroUsuario; 