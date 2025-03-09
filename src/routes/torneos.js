const express = require('express');
const router = express.Router();
const { 
  getTorneos, 
  getCrearTorneo, 
  crearTorneo, 
  getDetalleTorneo, 
  agregarParticipante, 
  iniciarTorneo,
  getMisTorneos,
  getTiradasTorneo,
  registrarTirada,
  getDetalleParticipante,
  finalizarTorneo,
  eliminarTorneo,
  getClasificacionTorneo
} = require('../controllers/torneoController');
const { ensureAuthenticated, ensureAdmin } = require('../middleware/auth');

// Todos los torneos disponibles
router.get('/', ensureAuthenticated, getTorneos);

// Mis torneos (creados y participando)
router.get('/mis-torneos', ensureAuthenticated, getMisTorneos);

// Formulario de creación de torneo
router.get('/crear', ensureAuthenticated, getCrearTorneo);

// Crear nuevo torneo
router.post('/crear', ensureAuthenticated, crearTorneo);

// Ver detalle de torneo
router.get('/:id', ensureAuthenticated, getDetalleTorneo);

// Agregar participante a un torneo
router.post('/agregar-participante', ensureAuthenticated, agregarParticipante);

// Iniciar un torneo
router.get('/:id/iniciar', ensureAuthenticated, iniciarTorneo);

// Ver pantalla de registro de tiradas
router.get('/:id/tiradas', ensureAuthenticated, getTiradasTorneo);

// Registrar una tirada
router.post('/:id/registrar-tirada', ensureAuthenticated, registrarTirada);

// Ver detalle de un participante
router.get('/:id/participante/:participanteId/detalle', ensureAuthenticated, getDetalleParticipante);

// Ver clasificación del torneo
router.get('/:id/clasificacion', ensureAuthenticated, getClasificacionTorneo);

// Finalizar un torneo
router.get('/:id/finalizar', ensureAuthenticated, finalizarTorneo);

// Eliminar un torneo (solo admin o creador)
router.get('/:id/eliminar', ensureAuthenticated, eliminarTorneo);

module.exports = router; 