const express = require('express');
const router = express.Router();
const { ensureAuthenticated, ensureAdmin } = require('../middleware/auth');
const { getProfile } = require('../controllers/userController');
const { getLogrosUsuario, inicializarLogros, reinicializarLogros } = require('../controllers/logroController');

// Ruta para ver el perfil del usuario
router.get('/profile', ensureAuthenticated, getProfile);

// Ruta para ver los logros del usuario
router.get('/logros', ensureAuthenticated, getLogrosUsuario);

// Ruta para inicializar los logros (sólo para admins en producción, pero disponible para todos en desarrollo)
router.get('/logros/inicializar', ensureAuthenticated, inicializarLogros);

// Ruta para REINICIALIZAR todos los logros (elimina los anteriores y crea los nuevos)
router.get('/logros/reinicializar', ensureAuthenticated, reinicializarLogros);

module.exports = router; 