const Torneo = require('../models/Torneo');
const User = require('../models/User');

// Obtener todos los torneos
exports.getTorneos = async (req, res) => {
  try {
    // Procesar parámetros de filtro y paginación
    const filtros = {
      fechaDesde: req.query.fechaDesde || '',
      fechaHasta: req.query.fechaHasta || '',
      ocultarFinalizados: req.query.ocultarFinalizados === 'on',
      busqueda: req.query.busqueda || '',
      pagina: parseInt(req.query.pagina) || 1,
      porPagina: parseInt(req.query.porPagina) || 10
    };
    
    // Construir el query de búsqueda
    let query = {};
    
    // Filtro por fechas
    if (filtros.fechaDesde || filtros.fechaHasta) {
      query.fecha = {};
      if (filtros.fechaDesde) {
        query.fecha.$gte = new Date(filtros.fechaDesde);
      }
      if (filtros.fechaHasta) {
        const fechaHasta = new Date(filtros.fechaHasta);
        fechaHasta.setHours(23, 59, 59, 999);
        query.fecha.$lte = fechaHasta;
      }
    }
    
    // Filtro para ocultar torneos finalizados
    if (filtros.ocultarFinalizados) {
      query.estado = { $ne: 'finalizado' };
    }
    
    // Búsqueda por nombre o distancia
    if (filtros.busqueda) {
      query.$or = [
        { nombre: new RegExp(filtros.busqueda, 'i') },
        { distancia: new RegExp(filtros.busqueda, 'i') }
      ];
    }
    
    // Calcular total de documentos para la paginación
    const total = await Torneo.countDocuments(query);
    const totalPaginas = Math.ceil(total / filtros.porPagina);
    
    // Ajustar página actual si excede el total
    filtros.pagina = Math.min(filtros.pagina, totalPaginas);
    
    // Obtener torneos con los filtros aplicados y paginación
    const torneos = await Torneo.find(query)
      .populate('creador', 'nombre apellido cedula')
      .sort({ createdAt: -1 })
      .skip((filtros.pagina - 1) * filtros.porPagina)
      .limit(filtros.porPagina);

    // Renderizar vista con datos de paginación
    res.render('torneos/index', {
      title: 'Torneos de Arquería',
      torneos,
      filtros,
      paginacion: {
        actual: filtros.pagina,
        total: totalPaginas,
        siguiente: filtros.pagina < totalPaginas ? filtros.pagina + 1 : null,
        anterior: filtros.pagina > 1 ? filtros.pagina - 1 : null,
        paginas: Array.from({length: totalPaginas}, (_, i) => i + 1)
      }
    });
  } catch (error) {
    console.error('Error al obtener torneos:', error);
    req.flash('error_msg', 'Error al cargar los torneos');
    res.redirect('/dashboard');
  }
};

// Mostrar formulario para crear torneo
exports.getCrearTorneo = (req, res) => {
  res.render('torneos/crear', {
    title: 'Crear Torneo'
  });
};

// Crear un nuevo torneo
exports.crearTorneo = async (req, res) => {
  try {
    const { nombre, fecha, distancia, flechasPorTirada, rondas } = req.body;
    
    // Crear nuevo torneo
    const nuevoTorneo = new Torneo({
      nombre: nombre || 'Torneo',
      fecha: fecha || new Date(),
      distancia,
      flechasPorTirada,
      rondas,
      creador: req.user.id
    });
    
    // Añadir al creador como participante automáticamente
    nuevoTorneo.agregarParticipante(req.user.id);
    
    await nuevoTorneo.save();
    
    req.flash('success_msg', 'Torneo creado con éxito');
    res.redirect(`/torneos/${nuevoTorneo.id}`);
  } catch (error) {
    req.flash('error_msg', 'Error al crear el torneo');
    res.redirect('/torneos/crear');
  }
};

// Ver detalles de un torneo
exports.getDetalleTorneo = async (req, res) => {
  try {
    const torneo = await Torneo.findById(req.params.id)
      .populate('creador', 'nombre apellido cedula')
      .populate('participantes.usuario', 'nombre apellido cedula tipoArco');
    
    if (!torneo) {
      req.flash('error_msg', 'Torneo no encontrado');
      return res.redirect('/torneos');
    }
    
    // Verificar si el usuario actual es el creador del torneo
    const esCreador = torneo.creador._id.toString() === req.user.id.toString();
    
    // Buscar usuarios que no están ya participando para poder agregarlos
    let usuariosDisponibles = [];
    if (esCreador && torneo.estado === 'preparacion') {
      // Obtener IDs de participantes actuales
      const participantesIds = torneo.participantes.map(p => 
        p.usuario ? p.usuario._id.toString() : null
      ).filter(Boolean);
      
      // Buscar usuarios que no son participantes y que están activos
      usuariosDisponibles = await User.find({
        _id: { $nin: participantesIds },
        activo: true
      }).select('cedula nombre apellido');
    }
    
    res.render('torneos/detalle', {
      title: torneo.nombre,
      torneo,
      esCreador,
      usuariosDisponibles
    });
  } catch (error) {
    req.flash('error_msg', 'Error al cargar el detalle del torneo');
    res.redirect('/torneos');
  }
};

// Agregar participante al torneo
exports.agregarParticipante = async (req, res) => {
  try {
    const { torneoId, usuarioId } = req.body;
    
    // Verificar que existe el torneo
    const torneo = await Torneo.findById(torneoId);
    if (!torneo) {
      req.flash('error_msg', 'Torneo no encontrado');
      return res.redirect('/torneos');
    }
    
    // Verificar que el usuario es el creador del torneo
    if (torneo.creador.toString() !== req.user.id) {
      req.flash('error_msg', 'No tienes permiso para agregar participantes');
      return res.redirect(`/torneos/${torneoId}`);
    }
    
    // Verificar que el torneo está en etapa de preparación
    if (torneo.estado !== 'preparacion') {
      req.flash('error_msg', 'No se pueden agregar participantes a un torneo ya iniciado');
      return res.redirect(`/torneos/${torneoId}`);
    }
    
    // Verificar que el usuario a agregar existe
    const usuario = await User.findById(usuarioId);
    if (!usuario) {
      req.flash('error_msg', 'Usuario no encontrado');
      return res.redirect(`/torneos/${torneoId}`);
    }
    
    // Usar el método del modelo para agregar el participante
    const resultado = torneo.agregarParticipante(usuarioId);
    
    if (resultado) {
      await torneo.save();
      req.flash('success_msg', `${usuario.nombre} ${usuario.apellido} ha sido agregado al torneo`);
    } else {
      req.flash('error_msg', 'El usuario ya está registrado en este torneo');
    }
    
    res.redirect(`/torneos/${torneoId}`);
  } catch (error) {
    req.flash('error_msg', 'Error al agregar el participante');
    res.redirect(`/torneos/${req.body.torneoId || ''}`);
  }
};

// Iniciar el torneo (cambiar estado a activo)
exports.iniciarTorneo = async (req, res) => {
  try {
    const torneo = await Torneo.findById(req.params.id);
    
    if (!torneo) {
      req.flash('error_msg', 'Torneo no encontrado');
      return res.redirect('/torneos');
    }
    
    // Verificar que el usuario es el creador del torneo
    if (!torneo.esCreador(req.user.id)) {
      req.flash('error_msg', 'No tienes permiso para iniciar este torneo');
      return res.redirect(`/torneos/${req.params.id}`);
    }
    
    // Verificar que hay al menos 2 participantes aceptados
    const participantesAceptados = torneo.participantes.filter(
      p => p.estado === 'aceptado'
    );
    
    if (participantesAceptados.length < 2) {
      req.flash('error_msg', 'El torneo debe tener al menos 2 participantes para iniciar');
      return res.redirect(`/torneos/${req.params.id}`);
    }
    
    // Cambiar estado a activo
    torneo.estado = 'activo';
    await torneo.save();
    
    req.flash('success_msg', 'El torneo ha iniciado correctamente');
    res.redirect(`/torneos/${req.params.id}`);
  } catch (error) {
    req.flash('error_msg', 'Error al iniciar el torneo');
    res.redirect(`/torneos/${req.params.id}`);
  }
};

// Obtener los torneos en los que el usuario participa o es creador
exports.getMisTorneos = async (req, res) => {
  try {
    // Procesar parámetros de filtro
    const filtros = {
      fechaDesde: req.query.fechaDesde || '',
      fechaHasta: req.query.fechaHasta || '',
      ocultarFinalizados: req.query.ocultarFinalizados === 'on'
    };
    
    // Construir el query base
    let queryBase = {};
    
    // Filtro por fechas
    if (filtros.fechaDesde || filtros.fechaHasta) {
      queryBase.fecha = {};
      if (filtros.fechaDesde) {
        queryBase.fecha.$gte = new Date(filtros.fechaDesde);
      }
      if (filtros.fechaHasta) {
        // Ajustar la fecha final para incluir todo el día
        const fechaHasta = new Date(filtros.fechaHasta);
        fechaHasta.setHours(23, 59, 59, 999);
        queryBase.fecha.$lte = fechaHasta;
      }
    }
    
    // Filtro para ocultar torneos finalizados
    if (filtros.ocultarFinalizados) {
      queryBase.estado = { $ne: 'finalizado' };
    }
    
    // Query para torneos creados por el usuario
    const queryCreados = { 
      ...queryBase,
      creador: req.user.id 
    };
    
    // Query para torneos en los que el usuario participa
    const queryParticipando = {
      ...queryBase,
      'participantes.usuario': req.user.id,
      creador: { $ne: req.user.id } // Excluir los que ya es creador
    };
    
    // Obtener los torneos
    const [torneosCreados, torneosParticipando] = await Promise.all([
      Torneo.find(queryCreados).sort({ createdAt: -1 }),
      Torneo.find(queryParticipando)
        .populate('creador', 'nombre apellido')
        .sort({ createdAt: -1 })
    ]);
    
    res.render('torneos/mis-torneos', {
      title: 'Mis Torneos',
      torneosCreados,
      torneosParticipando,
      filtros
    });
  } catch (error) {
    console.error('Error al obtener mis torneos:', error);
    req.flash('error_msg', 'Error al cargar los torneos');
    res.redirect('/dashboard');
  }
};

// Ver pantalla de registro de tiradas
exports.getTiradasTorneo = async (req, res) => {
  try {
    // Cargar torneo con todos los datos necesarios
    const torneo = await Torneo.findById(req.params.id)
      .populate('creador', 'nombre apellido cedula')
      .populate('participantes.usuario', 'nombre apellido cedula tipoArco');
    
    if (!torneo) {
      req.flash('error_msg', 'Torneo no encontrado');
      return res.redirect('/torneos');
    }
    
    // Verificar que el torneo está activo o finalizado
    if (torneo.estado === 'preparacion') {
      req.flash('error_msg', 'El torneo aún no está activo para ver tiradas');
      return res.redirect(`/torneos/${req.params.id}`);
    }
    
    // Verificar si es el creador
    const esCreador = torneo.creador._id.toString() === req.user.id.toString();
    
    // Obtener participantes activos (lo movemos aquí para que esté disponible en todo el scope)
    const participantesActivos = torneo.participantes.filter(p => p.estado === 'aceptado');
    
    // Determinar la ronda actual (solo relevante para torneos activos)
    let rondaActual = torneo.estado === 'finalizado' ? torneo.rondas : 1;
    
    if (torneo.estado === 'activo') {
      // Si hay tiradas registradas, encontrar la ronda más alta completada por todos
      if (participantesActivos.some(p => p.tiradas.length > 0)) {
        let rondasCompletas = true;
        
        // Verificar ronda por ronda hasta encontrar la primera incompleta
        while (rondasCompletas && rondaActual <= torneo.rondas) {
          // Verificar si todos los participantes activos tienen tirada registrada para esta ronda
          rondasCompletas = participantesActivos.every(participante => 
            participante.tiradas.some(tirada => tirada.ronda === rondaActual)
          );
          
          if (rondasCompletas) {
            rondaActual++; // Si todos tienen tirada para esta ronda, avanzar a la siguiente
          }
        }
      }
      
      // Asegurar que la ronda actual no exceda el total de rondas
      rondaActual = Math.min(rondaActual, torneo.rondas);
    }
    
    // Verificar si es la última ronda y si todas las tiradas están registradas
    const esUltimaRonda = rondaActual === torneo.rondas;
    const todasLasTiradasRegistradas = esUltimaRonda && participantesActivos.every(
      p => p.tiradas.some(t => t.ronda === rondaActual)
    );
    
    // Renderizar la vista
    res.render('torneos/tiradas', {
      title: `Tiradas - ${torneo.nombre}`,
      torneo,
      esCreador,
      rondaActual,
      esUltimaRonda,
      todasLasTiradasRegistradas,
      userId: req.user.id
    });
  } catch (error) {
    console.error('Error en getTiradasTorneo:', error);
    req.flash('error_msg', 'Error al cargar la página de tiradas');
    res.redirect('/torneos');
  }
};

// Registrar una tirada
exports.registrarTirada = async (req, res) => {
  try {
    const { ronda, participanteId } = req.body;
    const torneoId = req.params.id;
    
    // Depuración de datos recibidos
    console.log('Registrando tirada:', { torneoId, ronda, participanteId });
    console.log('Body completo:', req.body);
    
    // Extraer puntos del body - puede venir en diferentes formatos según cómo Express procese el formulario
    let puntosArray = [];
    
    // Intentar primero con formato puntos[0], puntos[1], etc. directamente en el body
    const puntosRegex = /^puntos\[(\d+)\]$/;
    const puntosKeys = Object.keys(req.body).filter(key => puntosRegex.test(key));
    
    if (puntosKeys.length > 0) {
      // Extraer los índices y valores
      const puntosIndices = {};
      puntosKeys.forEach(key => {
        const match = puntosRegex.exec(key);
        if (match) {
          const index = parseInt(match[1]);
          puntosIndices[index] = parseInt(req.body[key]);
        }
      });
      
      // Convertir a array ordenado
      const maxIndex = Math.max(...Object.keys(puntosIndices).map(k => parseInt(k)));
      puntosArray = Array(maxIndex + 1).fill(0);
      
      for (const [index, value] of Object.entries(puntosIndices)) {
        puntosArray[parseInt(index)] = value;
      }
    }
    // Verificar si viene como objeto con índices (puntos[0], puntos[1], etc.)
    else if (req.body.puntos && typeof req.body.puntos === 'object') {
      // Convertir el objeto a array
      const puntosTamano = Object.keys(req.body.puntos).length;
      puntosArray = Array(puntosTamano).fill(0);
      
      for (const key in req.body.puntos) {
        if (Object.hasOwnProperty.call(req.body.puntos, key)) {
          const index = parseInt(key);
          if (!isNaN(index) && index >= 0 && index < puntosTamano) {
            puntosArray[index] = parseInt(req.body.puntos[key]);
          }
        }
      }
    } 
    // Verificar si viene como array (puntos[])
    else if (req.body['puntos[]']) {
      const puntos = req.body['puntos[]'];
      puntosArray = Array.isArray(puntos) ? puntos.map(p => parseInt(p)) : [parseInt(puntos)];
    }
    
    if (puntosArray.length === 0) {
      req.flash('error_msg', 'Error: No se recibieron los datos de puntuación correctamente');
      return res.redirect(`/torneos/${torneoId}/tiradas`);
    }
    
    console.log('Puntos procesados:', puntosArray);
    
    // Calcular total de la tirada
    const total = puntosArray.reduce((sum, punto) => sum + punto, 0);
    console.log('Total calculado:', total);
    
    // Obtener el torneo
    const torneo = await Torneo.findById(torneoId)
      .populate('creador', 'nombre apellido cedula')
      .populate('participantes.usuario', 'nombre apellido cedula tipoArco');
    
    if (!torneo) {
      req.flash('error_msg', 'Torneo no encontrado');
      return res.redirect('/torneos');
    }
    
    // Verificar que el torneo está activo
    if (torneo.estado !== 'activo') {
      req.flash('error_msg', 'El torneo no está activo para registrar tiradas');
      return res.redirect(`/torneos/${torneoId}`);
    }
    
    // Verificar que el usuario es el creador del torneo
    const esCreador = torneo.creador._id.toString() === req.user.id.toString();
    console.log('Es creador del torneo:', esCreador);
    
    if (!esCreador) {
      req.flash('error_msg', 'Solo el creador del torneo puede registrar tiradas');
      return res.redirect(`/torneos/${torneoId}`);
    }
    
    // Verificar que existe el participante y está aceptado
    const participanteIndex = torneo.participantes.findIndex(
      p => p.usuario && p.usuario._id.toString() === participanteId && p.estado === 'aceptado'
    );
    console.log('Índice del participante encontrado:', participanteIndex);
    
    if (participanteIndex === -1) {
      req.flash('error_msg', 'Participante no encontrado o no aceptado');
      return res.redirect(`/torneos/${torneoId}/tiradas`);
    }
    
    // Verificar si el participante ya registró esta ronda
    const rondaExistente = torneo.participantes[participanteIndex].tiradas.findIndex(
      t => t.ronda === parseInt(ronda)
    );
    
    if (rondaExistente !== -1) {
      req.flash('error_msg', `Este participante ya tiene registrada la ronda ${ronda}`);
      return res.redirect(`/torneos/${torneoId}/tiradas`);
    }
    
    // Agregar la tirada al participante
    torneo.participantes[participanteIndex].tiradas.push({
      ronda: parseInt(ronda),
      puntos: puntosArray,
      total,
      registradoPor: req.user.id
    });
    
    // Recalcular la puntuación total del participante
    let puntuacionTotal = 0;
    torneo.participantes[participanteIndex].tiradas.forEach(tirada => {
      puntuacionTotal += tirada.total;
    });
    torneo.participantes[participanteIndex].puntuacion = puntuacionTotal;
    
    // Guardar los cambios
    await torneo.save();
    
    const nombreArquero = `${torneo.participantes[participanteIndex].usuario.nombre} ${torneo.participantes[participanteIndex].usuario.apellido}`;
    
    req.flash('success_msg', `Tirada registrada con éxito para ${nombreArquero}: ${total} puntos`);
    res.redirect(`/torneos/${torneoId}/tiradas`);
  } catch (error) {
    console.error('Error al registrar tirada:', error);
    req.flash('error_msg', 'Error al registrar la tirada');
    res.redirect(`/torneos/${req.params.id}/tiradas`);
  }
};

// Ver detalle de un participante
exports.getDetalleParticipante = async (req, res) => {
  try {
    const { id: torneoId, participanteId } = req.params;
    
    // Cargar torneo con todos los datos necesarios
    const torneo = await Torneo.findById(torneoId)
      .populate('participantes.usuario', 'nombre apellido cedula tipoArco');
    
    if (!torneo) {
      req.flash('error_msg', 'Torneo no encontrado');
      return res.redirect('/torneos');
    }
    
    // Buscar el participante
    const participante = torneo.participantes.find(
      p => p.usuario && p.usuario._id.toString() === participanteId
    );
    
    if (!participante) {
      req.flash('error_msg', 'Participante no encontrado');
      return res.redirect(`/torneos/${torneoId}/tiradas`);
    }
    
    // Calcular posición actual del participante
    const participantesOrdenados = [...torneo.participantes]
      .filter(p => p.estado === 'aceptado')
      .sort((a, b) => b.puntuacion - a.puntuacion);
    
    const posicion = participantesOrdenados.findIndex(
      p => p.usuario && p.usuario._id.toString() === participanteId
    ) + 1;
    
    // Calcular estadísticas adicionales
    const stats = {
      // Mejor y peor tirada
      mejorTirada: { total: 0, ronda: null },
      peorTirada: { total: participante.tiradas.length > 0 ? 100 : 0, ronda: null },
      
      // Totales y promedios
      totalFlechas: 0,
      promedioPorRonda: participante.tiradas.length > 0 ? participante.puntuacion / participante.tiradas.length : 0,
      promedioPorFlecha: 0,
      
      // Distribución de puntos
      distribucionPuntos: Array(11).fill(0),
      
      // Estadísticas avanzadas
      consistencia: 0,
      mejorFlecha: 0,
      peorFlecha: 10
    };
    
    // Calcular estadísticas basadas en las tiradas
    if (participante.tiradas.length > 0) {
      // Calcular todos los valores necesarios
      let todasLasPuntuaciones = [];
      
      participante.tiradas.forEach(tirada => {
        // Mejor y peor tirada
        if (tirada.total > stats.mejorTirada.total) {
          stats.mejorTirada = { total: tirada.total, ronda: tirada.ronda };
        }
        if (tirada.total < stats.peorTirada.total) {
          stats.peorTirada = { total: tirada.total, ronda: tirada.ronda };
        }
        
        // Contar flechas y distribución de puntos
        tirada.puntos.forEach(punto => {
          stats.totalFlechas++;
          if (stats.distribucionPuntos[punto] !== undefined) {
            stats.distribucionPuntos[punto]++;
          }
          todasLasPuntuaciones.push(punto);
          
          // Mejor y peor flecha
          if (punto > stats.mejorFlecha) stats.mejorFlecha = punto;
          if (punto < stats.peorFlecha) stats.peorFlecha = punto;
        });
      });
      
      // Calcular promedio por flecha
      stats.promedioPorFlecha = stats.totalFlechas > 0 ? participante.puntuacion / stats.totalFlechas : 0;
      
      // Calcular consistencia (desviación estándar)
      if (todasLasPuntuaciones.length > 1) {
        const media = todasLasPuntuaciones.reduce((a, b) => a + b, 0) / todasLasPuntuaciones.length;
        const sumaCuadradosDiferencias = todasLasPuntuaciones.reduce((suma, valor) => {
          return suma + Math.pow(valor - media, 2);
        }, 0);
        stats.consistencia = Math.sqrt(sumaCuadradosDiferencias / todasLasPuntuaciones.length);
      }
    }
    
    // Renderizar la vista
    res.render('torneos/participante-detalle', {
      title: `Detalle de Participante - ${torneo.nombre}`,
      torneo,
      participante,
      posicion,
      stats
    });
  } catch (error) {
    console.error('Error al cargar el detalle del participante:', error);
    req.flash('error_msg', 'Error al cargar el detalle del participante');
    res.redirect(`/torneos/${req.params.id}/tiradas`);
  }
};

// Finalizar el torneo
exports.finalizarTorneo = async (req, res) => {
  try {
    const torneo = await Torneo.findById(req.params.id);
    
    if (!torneo) {
      req.flash('error_msg', 'Torneo no encontrado');
      return res.redirect('/torneos');
    }
    
    // Verificar que el usuario es el creador
    if (!torneo.esCreador(req.user.id)) {
      req.flash('error_msg', 'No tienes permiso para finalizar este torneo');
      return res.redirect(`/torneos/${req.params.id}`);
    }
    
    // Verificar que el torneo está activo
    if (torneo.estado !== 'activo') {
      req.flash('error_msg', 'Solo se pueden finalizar torneos activos');
      return res.redirect(`/torneos/${req.params.id}`);
    }
    
    // Cambiar estado a finalizado
    torneo.estado = 'finalizado';
    await torneo.save();
    
    req.flash('success_msg', 'El torneo ha finalizado correctamente');
    res.redirect(`/torneos/${req.params.id}`);
  } catch (error) {
    req.flash('error_msg', 'Error al finalizar el torneo');
    res.redirect(`/torneos/${req.params.id}`);
  }
};

// Eliminar un torneo
exports.eliminarTorneo = async (req, res) => {
  try {
    const torneoId = req.params.id;
    
    // Buscar el torneo
    const torneo = await Torneo.findById(torneoId);
    
    if (!torneo) {
      req.flash('error_msg', 'Torneo no encontrado');
      return res.redirect('/torneos');
    }
    
    // Verificar que el usuario sea el creador o administrador
    const esCreador = torneo.creador.toString() === req.user.id.toString();
    const esAdmin = req.user.isAdmin;
    
    if (!esCreador && !esAdmin) {
      req.flash('error_msg', 'No tienes permiso para eliminar este torneo');
      return res.redirect('/torneos');
    }
    
    // Eliminar el torneo
    await Torneo.findByIdAndDelete(torneoId);
    
    req.flash('success_msg', 'Torneo eliminado con éxito');
    
    // Redireccionar a la página anterior o a la lista de torneos
    const referer = req.get('Referer');
    if (referer && referer.includes('/torneos')) {
      res.redirect('/torneos/mis-torneos');
    } else {
      res.redirect('/torneos');
    }
    
  } catch (error) {
    console.error('Error al eliminar torneo:', error);
    req.flash('error_msg', 'Error al eliminar el torneo');
    res.redirect('/torneos');
  }
};

// Ver clasificación de un torneo
exports.getClasificacionTorneo = async (req, res) => {
  try {
    const torneoId = req.params.id;
    
    // Cargar torneo con todos los datos necesarios
    const torneo = await Torneo.findById(torneoId)
      .populate('creador', 'nombre apellido cedula')
      .populate('participantes.usuario', 'nombre apellido cedula tipoArco');
    
    if (!torneo) {
      req.flash('error_msg', 'Torneo no encontrado');
      return res.redirect('/torneos');
    }
    
    // Ordenar participantes por puntuación
    const participantes = [...torneo.participantes]
      .filter(p => p.estado === 'aceptado')
      .sort((a, b) => b.puntuacion - a.puntuacion);
    
    // Renderizar vista
    res.render('torneos/clasificacion', {
      title: `Clasificación - ${torneo.nombre}`,
      torneo,
      participantes
    });
  } catch (error) {
    console.error('Error al cargar la clasificación del torneo:', error);
    req.flash('error_msg', 'Error al cargar la clasificación del torneo');
    res.redirect(`/torneos/${req.params.id}`);
  }
}; 