const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../middleware/auth');
const {
  getEntrenamientos,
  getCrearEntrenamiento,
  crearEntrenamiento,
  getDetalleEntrenamiento,
  getTiradasEntrenamiento,
  registrarTirada,
  finalizarEntrenamiento,
  eliminarEntrenamiento,
  getEstadisticasEntrenamiento,
  getEstadisticasGenerales
} = require('../controllers/entrenamientoController');

// Ruta para ver todos los entrenamientos del usuario
router.get('/', ensureAuthenticated, getEntrenamientos);

// Rutas para crear un nuevo entrenamiento
router.get('/crear', ensureAuthenticated, getCrearEntrenamiento);
router.post('/crear', ensureAuthenticated, crearEntrenamiento);

// Ruta para ver estadísticas generales de evolución
router.get('/evolucion', ensureAuthenticated, getEstadisticasGenerales);

// Ruta para ver detalle de un entrenamiento específico
router.get('/:id', ensureAuthenticated, getDetalleEntrenamiento);

// Rutas para registrar tiradas
router.get('/:id/tiradas', ensureAuthenticated, getTiradasEntrenamiento);
router.post('/:id/tiradas', ensureAuthenticated, registrarTirada);

// Ruta para finalizar un entrenamiento
router.get('/:id/finalizar', ensureAuthenticated, finalizarEntrenamiento);

// Ruta para eliminar un entrenamiento
router.get('/:id/eliminar', ensureAuthenticated, eliminarEntrenamiento);

// Ruta para ver estadísticas detalladas de un entrenamiento
router.get('/:id/estadisticas', ensureAuthenticated, getEstadisticasEntrenamiento);

module.exports = router; 