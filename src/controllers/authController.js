const User = require('../models/User');
const passport = require('passport');

// Registrar usuario
exports.register = async (req, res) => {
  try {
    const { cedula, nombre, apellido, tipoArco, password, confirmPassword } = req.body;

    // Verificar que las contraseñas coincidan
    if (password !== confirmPassword) {
      req.flash('error_msg', 'Las contraseñas no coinciden');
      return res.redirect('/register');
    }

    // Verificar si el usuario ya existe
    const userExists = await User.findOne({ cedula });
    if (userExists) {
      req.flash('error_msg', 'La cédula ya está registrada');
      return res.redirect('/register');
    }

    // Crear el usuario
    const newUser = new User({
      cedula,
      nombre,
      apellido,
      tipoArco,
      password
    });

    // Verificar si es el primer usuario (admin)
    const userCount = await User.countDocuments({});
    if (userCount === 0) {
      newUser.isAdmin = true;
    }

    await newUser.save();
    req.flash('success_msg', 'Registro exitoso, ahora puedes iniciar sesión');
    res.redirect('/login');
  } catch (error) {
    req.flash('error_msg', 'Error al registrar el usuario');
    res.redirect('/register');
  }
};

// Login
exports.login = (req, res, next) => {
  passport.authenticate('local', {
    successRedirect: '/dashboard',
    failureRedirect: '/login',
    failureFlash: true
  })(req, res, next);
};

// Cerrar sesión
exports.logout = (req, res) => {
  req.logout(function(err) {
    if (err) { return next(err); }
    req.flash('success_msg', 'Has cerrado sesión correctamente');
    res.redirect('/login');
  });
};

// Listar usuarios (solo admin)
exports.listUsers = async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      req.flash('error_msg', 'No tienes permiso para acceder a esta sección');
      return res.redirect('/dashboard');
    }

    const users = await User.find().select('-password');
    res.render('users/list', {
      users,
      title: 'Gestión de Usuarios'
    });
  } catch (error) {
    req.flash('error_msg', 'Error al listar los usuarios');
    res.redirect('/dashboard');
  }
};

// Cambiar estado de usuario (activar/desactivar) (solo admin)
exports.toggleUserStatus = async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      req.flash('error_msg', 'No tienes permiso para realizar esta acción');
      return res.redirect('/dashboard');
    }

    const user = await User.findById(req.params.id);
    
    if (!user) {
      req.flash('error_msg', 'Usuario no encontrado');
      return res.redirect('/users');
    }

    // No permitir desactivar al propio administrador
    if (user._id.toString() === req.user._id.toString()) {
      req.flash('error_msg', 'No puedes desactivar tu propia cuenta');
      return res.redirect('/users');
    }

    user.activo = !user.activo;
    await user.save();

    req.flash('success_msg', `Usuario ${user.activo ? 'activado' : 'desactivado'} correctamente`);
    res.redirect('/users');
  } catch (error) {
    req.flash('error_msg', 'Error al cambiar el estado del usuario');
    res.redirect('/users');
  }
}; 