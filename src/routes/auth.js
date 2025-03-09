const express = require('express');
const router = express.Router();
const { register, login, logout, listUsers, toggleUserStatus } = require('../controllers/authController');
const { ensureAuthenticated, ensureNotAuthenticated, ensureAdmin } = require('../middleware/auth');

// Ruta para registro de usuarios
router.get('/register', ensureNotAuthenticated, (req, res) => {
  res.render('register', {
    title: 'Registro'
  });
});

router.post('/register', ensureNotAuthenticated, register);

// Ruta para login
router.get('/login', ensureNotAuthenticated, (req, res) => {
  res.render('login', {
    title: 'Iniciar Sesión'
  });
});

router.post('/login', ensureNotAuthenticated, login);

// Ruta para cerrar sesión
router.get('/logout', ensureAuthenticated, logout);

// Rutas para gestión de usuarios (solo admin)
router.get('/users', ensureAuthenticated, ensureAdmin, listUsers);
router.get('/users/toggle/:id', ensureAuthenticated, ensureAdmin, toggleUserStatus);

module.exports = router; 