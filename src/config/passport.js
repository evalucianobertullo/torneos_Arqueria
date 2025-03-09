const LocalStrategy = require('passport-local').Strategy;
const User = require('../models/User');

module.exports = function(passport) {
  passport.use(
    new LocalStrategy({ usernameField: 'cedula' }, async (cedula, password, done) => {
      try {
        // Buscar usuario por cédula
        const user = await User.findOne({ cedula });
        
        if (!user) {
          return done(null, false, { message: 'Esa cédula no está registrada' });
        }

        // Verificar si el usuario está activo
        if (!user.activo) {
          return done(null, false, { message: 'Esta cuenta ha sido desactivada' });
        }

        // Verificar contraseña
        const isMatch = await user.matchPassword(password);
        
        if (!isMatch) {
          return done(null, false, { message: 'Contraseña incorrecta' });
        }
        
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    })
  );

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });
}; 