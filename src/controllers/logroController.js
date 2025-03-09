const { 
  obtenerLogrosUsuario, 
  obtenerTodosLosLogros,
  inicializarLogros
} = require('../services/logroService');
const User = require('../models/User');

// Inicializar los logros en la base de datos
exports.inicializarLogros = async (req, res) => {
  try {
    const resultados = await inicializarLogros();
    
    if (Array.isArray(resultados) && resultados.length > 0) {
      req.flash('mensajeExito', `Logros inicializados correctamente. Se han creado ${resultados.length} logros.`);
    } else {
      req.flash('mensajeExito', 'Los logros ya estaban inicializados en el sistema.');
    }
    
    // Redireccionar a la página de logros
    res.redirect('/users/logros');
  } catch (error) {
    console.error('Error al inicializar logros:', error);
    req.flash('mensajeError', 'Error al inicializar logros. Consulta los logs para más detalles.');
    res.redirect('/users/logros');
  }
};

// Reinicializar todos los logros (borrando los anteriores)
exports.reinicializarLogros = async (req, res) => {
  try {
    // 1. Eliminar los logros obtenidos por usuarios
    const LogroUsuario = require('../models/LogroUsuario');
    await LogroUsuario.deleteMany({});
    
    // 2. Eliminar todos los logros existentes
    const Logro = require('../models/Logro');
    await Logro.deleteMany({});
    
    // 3. Inicializar nuevos logros
    const resultados = await inicializarLogros();
    
    req.flash('mensajeExito', `Logros reinicializados correctamente. Se han creado ${resultados.length} logros nuevos.`);
    res.redirect('/users/logros');
  } catch (error) {
    console.error('Error al reinicializar logros:', error);
    req.flash('mensajeError', 'Error al reinicializar los logros. Consulta los logs para más detalles.');
    res.redirect('/users/logros');
  }
};

// Obtener página de logros del usuario
exports.getLogrosUsuario = async (req, res) => {
  try {
    const logrosUsuario = await obtenerLogrosUsuario(req.user._id);
    const todosLosLogros = await obtenerTodosLosLogros();
    
    // Organizar logros por tipo para una mejor visualización
    const tiposLogros = {
      entrenamiento: { 
        nombre: 'Entrenamientos',
        icono: 'fa-bullseye',
        color: 'primary',
        logros: []
      },
      puntaje: { 
        nombre: 'Puntuación',
        icono: 'fa-star',
        color: 'warning',
        logros: []
      },
      consistencia: { 
        nombre: 'Precisión',
        icono: 'fa-crosshairs',
        color: 'success',
        logros: []
      },
      experiencia: { 
        nombre: 'Constancia',
        icono: 'fa-calendar-check',
        color: 'info',
        logros: []
      }
    };
    
    // Extraer IDs de logros desbloqueados
    const logrosDesbloqueadosIds = logrosUsuario.map(item => item.logro._id.toString());
    
    // Clasificar todos los logros por tipo y marcar cuáles están desbloqueados
    todosLosLogros.forEach(logro => {
      const tipo = logro.tipo;
      if (tiposLogros[tipo]) {
        const desbloqueado = logrosDesbloqueadosIds.includes(logro._id.toString());
        tiposLogros[tipo].logros.push({
          ...logro._doc,
          desbloqueado
        });
      }
    });
    
    // Calcular estadísticas
    const totalLogros = todosLosLogros.length;
    const totalDesbloqueados = logrosUsuario.length;
    const porcentajeCompletado = totalLogros > 0 ? (totalDesbloqueados / totalLogros * 100).toFixed(1) : 0;
    
    // Obtener información de nivel del usuario
    const user = await User.findById(req.user._id);
    const porcentajeNivel = user.experiencia_necesaria > 0 
      ? (user.experiencia / user.experiencia_necesaria * 100).toFixed(1) 
      : 0;
    
    res.render('users/logros', {
      title: 'Mis Logros',
      user: req.user,
      tiposLogros,
      estadisticas: {
        totalLogros,
        totalDesbloqueados,
        porcentajeCompletado,
        nivel: user.nivel,
        experiencia: user.experiencia,
        experiencia_necesaria: user.experiencia_necesaria,
        porcentajeNivel
      },
      mensajeExito: req.flash('mensajeExito'),
      mensajeError: req.flash('mensajeError')
    });
  } catch (error) {
    console.error('Error al obtener logros del usuario:', error);
    req.flash('mensajeError', 'Error al cargar tus logros');
    res.redirect('/dashboard');
  }
}; 