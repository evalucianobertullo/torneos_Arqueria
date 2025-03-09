// Middleware para asegurar que el usuario está autenticado
exports.ensureAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  req.flash('mensajeError', 'Por favor inicia sesión para acceder');
  res.redirect('/login');
};

// Middleware para asegurar que el usuario no está autenticado
exports.ensureNotAuthenticated = (req, res, next) => {
  if (!req.isAuthenticated()) {
    return next();
  }
  req.flash('mensajeError', 'Ya has iniciado sesión');
  res.redirect('/dashboard');
};

// Middleware para verificar si el usuario es administrador
exports.ensureAdmin = (req, res, next) => {
  if (req.user && req.user.isAdmin) {
    return next();
  }
  req.flash('mensajeError', 'No tienes permisos para acceder a esta sección');
  res.redirect('/dashboard');
}; 