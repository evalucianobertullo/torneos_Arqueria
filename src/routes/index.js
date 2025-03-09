const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../middleware/auth');

// Ruta principal
router.get('/', (req, res) => {
  res.render('index', {
    title: 'Torneos de Arquería',
    user: req.user
  });
});

// Ruta de logout
router.get('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      console.error('Error al cerrar sesión:', err);
      return res.redirect('/');
    }
    req.flash('mensajeExito', 'Has cerrado sesión correctamente');
    res.redirect('/');
  });
});

module.exports = router; 