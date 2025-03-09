const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  cedula: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  nombre: {
    type: String,
    required: true,
    trim: true
  },
  apellido: {
    type: String,
    required: true,
    trim: true
  },
  tipoArco: {
    type: String,
    required: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  isAdmin: {
    type: Boolean,
    default: false
  },
  activo: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  nivel: {
    type: Number,
    default: 1
  },
  experiencia: {
    type: Number,
    default: 0
  },
  experiencia_necesaria: {
    type: Number,
    default: 100
  },
  total_flechas_lanzadas: {
    type: Number,
    default: 0
  },
  total_entrenamientos: {
    type: Number,
    default: 0
  },
  entrenamientos_consecutivos: {
    type: Number,
    default: 0
  },
  ultima_fecha_entrenamiento: {
    type: Date,
    default: null
  }
});

// Método para encriptar contraseña antes de guardar
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Método para comparar contraseñas durante login
UserSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema); 