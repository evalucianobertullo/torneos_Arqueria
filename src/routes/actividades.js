const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../middleware/auth');
const { getFeedActividades, getActividadesUsuario } = require('../controllers/actividadController');

// Ruta para el feed de actividades general
router.get('/', ensureAuthenticated, getFeedActividades);

// Ruta para ver las actividades de un usuario específico
router.get('/usuario/:userId', ensureAuthenticated, getActividadesUsuario);

// Ruta para ver las actividades propias
router.get('/mis-actividades', ensureAuthenticated, (req, res) => {
  res.redirect(`/actividades/usuario/${req.user._id}`);
});

module.exports = router; 