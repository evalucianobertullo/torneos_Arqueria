const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { ensureAuthenticated, ensureAdmin } = require('../middleware/auth');
const configController = require('../controllers/configController');
const estadisticasController = require('../controllers/estadisticasController');

// Configurar multer para la subida de archivos
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../../public/uploads/logos'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'logo-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    const filetypes = /jpeg|jpg|png|gif|svg/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Solo se permiten archivos de imagen'));
  },
  limits: {
    fileSize: 1024 * 1024 // 1MB
  }
});

// Rutas de configuración (solo accesibles por administradores)
router.get('/config', ensureAuthenticated, ensureAdmin, configController.getConfig);
router.post('/config', ensureAuthenticated, ensureAdmin, upload.single('logo'), configController.updateConfig);
router.get('/config/reset', ensureAuthenticated, ensureAdmin, async (req, res) => {
  try {
    const AppConfig = require('../models/AppConfig');
    await AppConfig.deleteOne(); // Eliminar configuración actual
    req.flash('mensajeExito', 'Configuración reseteada a valores por defecto');
    res.redirect('/admin/config');
  } catch (error) {
    console.error('Error al resetear configuración:', error);
    req.flash('mensajeError', 'Error al resetear la configuración');
    res.redirect('/admin/config');
  }
});

// Rutas de rankings y estadísticas
router.get('/rankings', ensureAuthenticated, ensureAdmin, estadisticasController.getRankings);
router.get('/estadisticas/:userId', ensureAuthenticated, ensureAdmin, estadisticasController.getEstadisticasArquero);

module.exports = router; 