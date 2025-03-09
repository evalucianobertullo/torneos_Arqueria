const Actividad = require('../models/Actividad');
const User = require('../models/User');

/**
 * Registrar una nueva actividad
 * @param {Object} datos - Datos de la actividad
 * @returns {Promise<Object>} - La actividad creada
 */
exports.registrarActividad = async (datos) => {
  try {
    const actividad = new Actividad(datos);
    return await actividad.save();
  } catch (error) {
    console.error('Error al registrar actividad:', error);
    throw error;
  }
};

/**
 * Registrar actividad de entrenamiento completado
 * @param {Object} usuario - Usuario que completó el entrenamiento
 * @param {Object} entrenamiento - Entrenamiento completado
 * @returns {Promise<Object>} - La actividad creada
 */
exports.registrarEntrenamientoCompletado = async (usuario, entrenamiento) => {
  try {
    // Calcular promedio
    const totalPuntos = entrenamiento.tiradas.reduce((sum, tirada) => sum + tirada.total, 0);
    const totalFlechas = entrenamiento.tiradas.reduce((sum, tirada) => sum + tirada.puntos.length, 0);
    const promedio = totalFlechas > 0 ? (totalPuntos / totalFlechas).toFixed(2) : 0;
    
    const datos = {
      usuario: usuario._id,
      tipo: 'entrenamiento',
      mensaje: `${usuario.nombre} ${usuario.apellido} completó el entrenamiento "${entrenamiento.nombre}" con un promedio de ${promedio}`,
      entidadId: entrenamiento._id,
      entidadModelo: 'Entrenamiento',
      icono: 'fa-bullseye',
      color: 'success'
    };
    
    return await exports.registrarActividad(datos);
  } catch (error) {
    console.error('Error al registrar actividad de entrenamiento:', error);
    throw error;
  }
};

/**
 * Registrar actividad de logro desbloqueado
 * @param {Object} usuario - Usuario que desbloqueó el logro
 * @param {Object} logro - Logro desbloqueado
 * @returns {Promise<Object>} - La actividad creada
 */
exports.registrarLogroDesbloqueado = async (usuario, logro) => {
  try {
    const datos = {
      usuario: usuario._id,
      tipo: 'logro',
      mensaje: `${usuario.nombre} ${usuario.apellido} desbloqueó el logro "${logro.titulo}"`,
      entidadId: logro._id,
      entidadModelo: 'Logro',
      icono: logro.icono || 'fa-trophy',
      color: 'warning'
    };
    
    return await exports.registrarActividad(datos);
  } catch (error) {
    console.error('Error al registrar actividad de logro:', error);
    throw error;
  }
};

/**
 * Registrar actividad de nivel alcanzado
 * @param {Object} usuario - Usuario que subió de nivel
 * @param {Number} nivel - Nivel alcanzado
 * @returns {Promise<Object>} - La actividad creada
 */
exports.registrarNivelAlcanzado = async (usuario, nivel) => {
  try {
    const datos = {
      usuario: usuario._id,
      tipo: 'nivel',
      mensaje: `${usuario.nombre} ${usuario.apellido} alcanzó el nivel ${nivel} en arquería`,
      entidadId: usuario._id,
      entidadModelo: 'User',
      icono: 'fa-level-up-alt',
      color: 'primary'
    };
    
    return await exports.registrarActividad(datos);
  } catch (error) {
    console.error('Error al registrar actividad de nivel:', error);
    throw error;
  }
};

/**
 * Obtener actividades recientes
 * @param {Number} limite - Número máximo de actividades a devolver
 * @param {Number} pagina - Número de página (para paginación)
 * @returns {Promise<Object[]>} - Lista de actividades
 */
exports.obtenerActividadesRecientes = async (limite = 20, pagina = 1) => {
  try {
    console.log('Obteniendo actividades recientes:', { limite, pagina });
    
    const skip = (pagina - 1) * limite;
    
    const actividades = await Actividad.find()
      .sort({ fecha: -1 })
      .skip(skip)
      .limit(limite)
      .populate('usuario', 'nombre apellido tipoArco')
      .populate('entidadId')
      .lean()
      .exec();
    
    console.log('Actividades encontradas:', actividades.length);
    
    const total = await Actividad.countDocuments();
    
    return {
      actividades,
      paginacion: {
        total,
        pagina,
        limite,
        totalPaginas: Math.ceil(total / limite)
      }
    };
  } catch (error) {
    console.error('Error al obtener actividades recientes:', error);
    throw error;
  }
};

/**
 * Obtener actividades de un usuario específico
 * @param {String} usuarioId - ID del usuario
 * @param {Number} limite - Número máximo de actividades a devolver
 * @param {Number} pagina - Número de página (para paginación)
 * @returns {Promise<Object[]>} - Lista de actividades del usuario
 */
exports.obtenerActividadesUsuario = async (usuarioId, limite = 10, pagina = 1) => {
  try {
    const skip = (pagina - 1) * limite;
    
    const actividades = await Actividad.find({ usuario: usuarioId })
      .sort({ fecha: -1 })
      .skip(skip)
      .limit(limite)
      .exec();
    
    const total = await Actividad.countDocuments({ usuario: usuarioId });
    
    return {
      actividades,
      paginacion: {
        total,
        pagina,
        limite,
        totalPaginas: Math.ceil(total / limite)
      }
    };
  } catch (error) {
    console.error(`Error al obtener actividades del usuario ${usuarioId}:`, error);
    throw error;
  }
};

/**
 * Crea una nueva actividad en el feed
 * @param {Object} datosActividad - Datos de la actividad
 * @returns {Promise<Object>} - La actividad creada
 */
exports.crearActividad = async (datosActividad) => {
  try {
    const actividad = new Actividad(datosActividad);
    await actividad.save();
    return actividad;
  } catch (error) {
    console.error('Error al crear actividad:', error);
    throw error;
  }
};

/**
 * Crea una actividad para un entrenamiento finalizado
 * @param {Object} entrenamiento - Entrenamiento finalizado
 * @param {Object} usuario - Usuario que finalizó el entrenamiento
 * @returns {Promise<Object>} - La actividad creada
 */
exports.crearActividadEntrenamiento = async (entrenamiento, usuario) => {
  try {
    // Calcular promedio del entrenamiento
    const totalPuntos = entrenamiento.tiradas.reduce((sum, tirada) => sum + tirada.total, 0);
    const totalFlechas = entrenamiento.tiradas.reduce((sum, tirada) => sum + tirada.puntos.length, 0);
    const promedio = totalFlechas > 0 ? (totalPuntos / totalFlechas).toFixed(2) : 0;
    
    // Crear la actividad
    const datosActividad = {
      tipo: 'entrenamiento',
      usuario: usuario._id,
      titulo: `${usuario.nombre} completó un entrenamiento`,
      descripcion: `Completó el entrenamiento "${entrenamiento.nombre}" con un promedio de ${promedio} puntos por flecha a una distancia de ${entrenamiento.distancia}.`,
      iconoClase: 'fa-bullseye',
      colorClase: 'primary',
      entrenamiento: entrenamiento._id,
      metadata: {
        promedio,
        distancia: entrenamiento.distancia,
        totalPuntos,
        totalFlechas
      }
    };
    
    return await exports.crearActividad(datosActividad);
  } catch (error) {
    console.error('Error al crear actividad de entrenamiento:', error);
    throw error;
  }
};

/**
 * Crea una actividad para un logro desbloqueado
 * @param {Object} logro - Logro desbloqueado
 * @param {Object} usuario - Usuario que desbloqueó el logro
 * @returns {Promise<Object>} - La actividad creada
 */
exports.crearActividadLogro = async (logro, usuario) => {
  try {
    const datosActividad = {
      tipo: 'logro',
      usuario: usuario._id,
      titulo: `${usuario.nombre} desbloqueó un logro`,
      descripcion: `Ha conseguido el logro "${logro.titulo}": ${logro.descripcion}`,
      iconoClase: logro.icono || 'fa-trophy',
      colorClase: 'warning',
      logro: logro._id,
      metadata: {
        nivel: logro.nivel,
        puntosExp: logro.puntos_exp
      }
    };
    
    return await exports.crearActividad(datosActividad);
  } catch (error) {
    console.error('Error al crear actividad de logro:', error);
    throw error;
  }
};

/**
 * Crea una actividad para un nivel alcanzado
 * @param {Number} nivel - Nuevo nivel alcanzado
 * @param {Object} usuario - Usuario que subió de nivel
 * @returns {Promise<Object>} - La actividad creada
 */
exports.crearActividadNivel = async (nivel, usuario) => {
  try {
    const datosActividad = {
      tipo: 'nivel',
      usuario: usuario._id,
      titulo: `${usuario.nombre} subió al nivel ${nivel}`,
      descripcion: `Ha alcanzado el nivel ${nivel} como arquero después de ganar suficiente experiencia.`,
      iconoClase: 'fa-level-up-alt',
      colorClase: 'success',
      metadata: {
        nivel,
        experienciaNecesaria: usuario.experiencia_necesaria
      }
    };
    
    return await exports.crearActividad(datosActividad);
  } catch (error) {
    console.error('Error al crear actividad de nivel:', error);
    throw error;
  }
};

/**
 * Obtiene las actividades para el feed principal
 * @param {Object} opciones - Opciones de paginación y filtrado
 * @returns {Promise<Array>} - Lista de actividades
 */
exports.obtenerActividades = async (opciones = {}) => {
  try {
    const { pagina = 1, limite = 10, tipo, usuarioId } = opciones;
    const skip = (pagina - 1) * limite;
    
    // Construir el query base
    let query = { publico: true };
    
    // Filtrar por tipo si se especifica
    if (tipo && tipo !== 'todos') {
      query.tipo = tipo;
    }
    
    // Filtrar por usuario si se especifica
    if (usuarioId) {
      query.usuario = usuarioId;
    }
    
    // Obtener actividades con sus usuarios
    const actividades = await Actividad.find(query)
      .sort({ fecha: -1 })
      .skip(skip)
      .limit(limite)
      .populate({
        path: 'usuario',
        select: 'nombre apellido cedula tipoArco'
      })
      .populate({
        path: 'comentarios.usuario',
        select: 'nombre apellido'
      });
    
    // Contar total de actividades para la paginación
    const totalActividades = await Actividad.countDocuments(query);
    
    return {
      actividades,
      totalPaginas: Math.ceil(totalActividades / limite),
      paginaActual: pagina,
      totalActividades
    };
  } catch (error) {
    console.error('Error al obtener actividades:', error);
    throw error;
  }
};

/**
 * Añade una reacción a una actividad
 * @param {String} actividadId - ID de la actividad
 * @param {String} usuarioId - ID del usuario que reacciona
 * @param {String} tipoReaccion - Tipo de reacción
 * @returns {Promise<Object>} - La actividad actualizada
 */
exports.agregarReaccion = async (actividadId, usuarioId, tipoReaccion = 'like') => {
  try {
    // Buscar la actividad
    const actividad = await Actividad.findById(actividadId);
    if (!actividad) {
      throw new Error('Actividad no encontrada');
    }
    
    // Verificar si el usuario ya ha reaccionado
    const reaccionExistente = actividad.reacciones.findIndex(
      r => r.usuario.toString() === usuarioId.toString()
    );
    
    // Si ya reaccionó, actualizar el tipo
    if (reaccionExistente !== -1) {
      // Si es la misma reacción, la eliminamos (toggle)
      if (actividad.reacciones[reaccionExistente].tipo === tipoReaccion) {
        actividad.reacciones.splice(reaccionExistente, 1);
      } else {
        // Si es diferente, actualizamos el tipo
        actividad.reacciones[reaccionExistente].tipo = tipoReaccion;
      }
    } else {
      // Si no ha reaccionado, añadir nueva reacción
      actividad.reacciones.push({
        usuario: usuarioId,
        tipo: tipoReaccion
      });
    }
    
    await actividad.save();
    return actividad;
  } catch (error) {
    console.error('Error al agregar reacción:', error);
    throw error;
  }
};

/**
 * Añade un comentario a una actividad
 * @param {String} actividadId - ID de la actividad
 * @param {String} usuarioId - ID del usuario que comenta
 * @param {String} texto - Texto del comentario
 * @returns {Promise<Object>} - La actividad actualizada
 */
exports.agregarComentario = async (actividadId, usuarioId, texto) => {
  try {
    // Validar el comentario
    if (!texto || texto.trim().length === 0) {
      throw new Error('El comentario no puede estar vacío');
    }
    
    // Buscar la actividad
    const actividad = await Actividad.findById(actividadId);
    if (!actividad) {
      throw new Error('Actividad no encontrada');
    }
    
    // Añadir el comentario
    actividad.comentarios.push({
      usuario: usuarioId,
      texto: texto.trim()
    });
    
    await actividad.save();
    
    // Poblar el usuario del comentario para devolver datos completos
    await actividad.populate({
      path: 'comentarios.usuario',
      select: 'nombre apellido'
    });
    
    return actividad;
  } catch (error) {
    console.error('Error al agregar comentario:', error);
    throw error;
  }
};

/**
 * Elimina un comentario de una actividad
 * @param {String} actividadId - ID de la actividad
 * @param {String} comentarioId - ID del comentario a eliminar
 * @param {String} usuarioId - ID del usuario que intenta eliminar (para verificar permisos)
 * @returns {Promise<Object>} - La actividad actualizada
 */
exports.eliminarComentario = async (actividadId, comentarioId, usuarioId) => {
  try {
    // Buscar la actividad
    const actividad = await Actividad.findById(actividadId);
    if (!actividad) {
      throw new Error('Actividad no encontrada');
    }
    
    // Encontrar el comentario
    const comentarioIndex = actividad.comentarios.findIndex(
      c => c._id.toString() === comentarioId
    );
    
    if (comentarioIndex === -1) {
      throw new Error('Comentario no encontrado');
    }
    
    // Verificar que el usuario sea el autor del comentario o un administrador
    const comentario = actividad.comentarios[comentarioIndex];
    const usuario = await User.findById(usuarioId);
    
    if (comentario.usuario.toString() !== usuarioId && !usuario.isAdmin) {
      throw new Error('No tienes permiso para eliminar este comentario');
    }
    
    // Eliminar el comentario
    actividad.comentarios.splice(comentarioIndex, 1);
    await actividad.save();
    
    return actividad;
  } catch (error) {
    console.error('Error al eliminar comentario:', error);
    throw error;
  }
};

/**
 * Crear una actividad de prueba (solo para desarrollo)
 * @param {Object} usuario - Usuario para el cual crear la actividad
 * @returns {Promise<Object>} - La actividad creada
 */
exports.crearActividadPrueba = async (usuario) => {
  try {
    const datos = {
      usuario: usuario._id,
      tipo: 'nivel',
      mensaje: `${usuario.nombre} ${usuario.apellido} está probando el sistema de actividades`,
      entidadId: usuario._id,
      entidadModelo: 'User',
      icono: 'fa-code',
      color: 'info'
    };
    
    console.log('Creando actividad de prueba:', datos);
    return await exports.registrarActividad(datos);
  } catch (error) {
    console.error('Error al crear actividad de prueba:', error);
    throw error;
  }
}; 