const { formatearFecha } = require('../utils/helpers');
const {
  obtenerActividades,
  agregarReaccion,
  agregarComentario,
  eliminarComentario,
  obtenerActividadesRecientes,
  obtenerActividadesUsuario
} = require('../services/actividadService');

/**
 * Muestra el feed de actividades
 */
exports.getFeed = async (req, res) => {
  try {
    // Obtener parámetros de consulta
    const pagina = parseInt(req.query.pagina) || 1;
    const tipo = req.query.tipo || 'todos';
    const usuarioId = req.query.usuario || null;
    
    // Obtener actividades
    const resultado = await obtenerActividades({
      pagina,
      limite: 10,
      tipo,
      usuarioId
    });
    
    // Renderizar vista
    res.render('feed/index', {
      title: 'Feed de Actividad',
      user: req.user,
      actividades: resultado.actividades,
      paginacion: {
        paginaActual: resultado.paginaActual,
        totalPaginas: resultado.totalPaginas,
        totalActividades: resultado.totalActividades
      },
      filtros: {
        tipo,
        usuarioId
      },
      formatearFecha,
      mensajeExito: req.flash('mensajeExito'),
      mensajeError: req.flash('mensajeError')
    });
  } catch (error) {
    console.error('Error al obtener feed de actividades:', error);
    req.flash('mensajeError', 'Error al cargar el feed de actividades');
    res.redirect('/dashboard');
  }
};

/**
 * Manejador para añadir una reacción a una actividad
 */
exports.postReaccion = async (req, res) => {
  try {
    const { actividadId, tipo } = req.body;
    
    if (!actividadId || !tipo) {
      req.flash('mensajeError', 'Datos incompletos');
      return res.redirect('/feed');
    }
    
    // Añadir la reacción
    await agregarReaccion(actividadId, req.user._id, tipo);
    
    // Redirigir a la página anterior o al feed
    const referer = req.get('Referer') || '/feed';
    res.redirect(referer);
  } catch (error) {
    console.error('Error al añadir reacción:', error);
    req.flash('mensajeError', 'Error al añadir reacción');
    res.redirect('/feed');
  }
};

/**
 * Manejador para añadir un comentario a una actividad
 */
exports.postComentario = async (req, res) => {
  try {
    const { actividadId, texto } = req.body;
    
    if (!actividadId || !texto) {
      req.flash('mensajeError', 'El comentario no puede estar vacío');
      return res.redirect('/feed');
    }
    
    // Añadir el comentario
    await agregarComentario(actividadId, req.user._id, texto);
    
    // Redirigir a la página anterior o al feed
    const referer = req.get('Referer') || '/feed';
    res.redirect(referer);
  } catch (error) {
    console.error('Error al añadir comentario:', error);
    req.flash('mensajeError', 'Error al añadir comentario');
    res.redirect('/feed');
  }
};

/**
 * Manejador para eliminar un comentario
 */
exports.deleteComentario = async (req, res) => {
  try {
    const { actividadId, comentarioId } = req.params;
    
    if (!actividadId || !comentarioId) {
      req.flash('mensajeError', 'Datos incompletos');
      return res.redirect('/feed');
    }
    
    // Eliminar el comentario
    await eliminarComentario(actividadId, comentarioId, req.user._id);
    
    // Redirigir a la página anterior o al feed
    const referer = req.get('Referer') || '/feed';
    res.redirect(referer);
  } catch (error) {
    console.error('Error al eliminar comentario:', error);
    req.flash('mensajeError', error.message || 'Error al eliminar comentario');
    res.redirect('/feed');
  }
};

/**
 * Renderizar la página del feed de actividades
 */
exports.getFeedActividades = async (req, res) => {
  try {
    // Obtener parámetros de paginación
    const pagina = parseInt(req.query.pagina) || 1;
    const limite = parseInt(req.query.limite) || 20;
    
    // Obtener actividades
    const resultado = await obtenerActividadesRecientes(limite, pagina);
    
    // Renderizar vista
    res.render('actividades/feed', {
      title: 'Feed de Actividad',
      user: req.user,
      actividades: resultado.actividades,
      paginacion: resultado.paginacion,
      formatearFecha,
      mensajeExito: req.flash('mensajeExito'),
      mensajeError: req.flash('mensajeError')
    });
  } catch (error) {
    console.error('Error al obtener feed de actividades:', error);
    req.flash('mensajeError', 'Ocurrió un error al cargar el feed de actividades');
    res.redirect('/dashboard');
  }
};

/**
 * Renderizar la página de actividades de un usuario específico
 */
exports.getActividadesUsuario = async (req, res) => {
  try {
    // Obtener parámetros de paginación
    const pagina = parseInt(req.query.pagina) || 1;
    const limite = parseInt(req.query.limite) || 10;
    
    // ID del usuario (puede ser del usuario actual u otro)
    const usuarioId = req.params.userId || req.user._id;
    
    // Obtener actividades
    const resultado = await obtenerActividadesUsuario(usuarioId, limite, pagina);
    
    // Renderizar vista
    res.render('actividades/usuario', {
      title: 'Mis Actividades',
      user: req.user,
      actividades: resultado.actividades,
      paginacion: resultado.paginacion,
      formatearFecha,
      usuarioId,
      esPropio: usuarioId.toString() === req.user._id.toString(),
      mensajeExito: req.flash('mensajeExito'),
      mensajeError: req.flash('mensajeError')
    });
  } catch (error) {
    console.error('Error al obtener actividades del usuario:', error);
    req.flash('mensajeError', 'Ocurrió un error al cargar las actividades');
    res.redirect('/dashboard');
  }
}; 