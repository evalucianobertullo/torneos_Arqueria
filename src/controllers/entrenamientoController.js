const Entrenamiento = require('../models/Entrenamiento');
const User = require('../models/User');
const { formatearFecha } = require('../utils/helpers');
const { verificarLogros } = require('../services/logroService');
const { registrarEntrenamientoCompletado } = require('../services/actividadService');

// Obtener todos los entrenamientos del usuario actual
exports.getEntrenamientos = async (req, res) => {
  try {
    const entrenamientos = await Entrenamiento.find({ usuario: req.user.id })
      .sort({ createdAt: -1 });

    res.render('entrenamientos/index', {
      entrenamientos,
      formatearFecha,
      mensajeExito: req.flash('mensajeExito'),
      mensajeError: req.flash('mensajeError')
    });
  } catch (error) {
    console.error('Error al obtener entrenamientos:', error);
    req.flash('mensajeError', 'Error al cargar los entrenamientos');
    res.redirect('/dashboard');
  }
};

// Renderizar la vista para crear un nuevo entrenamiento
exports.getCrearEntrenamiento = (req, res) => {
  res.render('entrenamientos/crear', {
    mensajeError: req.flash('mensajeError')
  });
};

// Procesar la creación de un nuevo entrenamiento
exports.crearEntrenamiento = async (req, res) => {
  try {
    const { nombre, fecha, flechasPorTirada, rondas, distancia } = req.body;
    
    // Validar datos
    if (!nombre || !fecha || !flechasPorTirada || !rondas || !distancia) {
      req.flash('mensajeError', 'Todos los campos son obligatorios');
      return res.redirect('/entrenamientos/crear');
    }

    // Crear nuevo entrenamiento
    const nuevoEntrenamiento = new Entrenamiento({
      nombre,
      fecha: new Date(fecha),
      usuario: req.user.id,
      flechasPorTirada,
      rondas,
      distancia,
      estado: 'activo'
    });

    await nuevoEntrenamiento.save();
    
    req.flash('mensajeExito', '¡Entrenamiento creado correctamente!');
    res.redirect(`/entrenamientos/${nuevoEntrenamiento._id}`);
  } catch (error) {
    console.error('Error al crear entrenamiento:', error);
    req.flash('mensajeError', 'Error al crear el entrenamiento');
    res.redirect('/entrenamientos/crear');
  }
};

// Obtener detalle de un entrenamiento específico
exports.getDetalleEntrenamiento = async (req, res) => {
  try {
    const entrenamiento = await Entrenamiento.findOne({
      _id: req.params.id,
      usuario: req.user.id
    }).populate('usuario');

    if (!entrenamiento) {
      req.flash('mensajeError', 'Entrenamiento no encontrado');
      return res.redirect('/entrenamientos');
    }

    res.render('entrenamientos/detalle', {
      entrenamiento,
      formatearFecha,
      mensajeExito: req.flash('mensajeExito'),
      mensajeError: req.flash('mensajeError')
    });
  } catch (error) {
    console.error('Error al obtener detalle del entrenamiento:', error);
    req.flash('mensajeError', 'Error al cargar los detalles del entrenamiento');
    res.redirect('/entrenamientos');
  }
};

// Renderizar la vista para registrar tiradas de un entrenamiento
exports.getTiradasEntrenamiento = async (req, res) => {
  try {
    const entrenamiento = await Entrenamiento.findOne({
      _id: req.params.id,
      usuario: req.user.id
    }).populate('usuario');

    if (!entrenamiento) {
      req.flash('mensajeError', 'Entrenamiento no encontrado');
      return res.redirect('/entrenamientos');
    }

    // Verificar que el entrenamiento esté activo
    if (entrenamiento.estado !== 'activo') {
      req.flash('mensajeError', 'Este entrenamiento ya ha finalizado y no se pueden registrar más tiradas');
      return res.redirect(`/entrenamientos/${entrenamiento._id}`);
    }

    // Determinar la ronda actual
    let rondaActual = 1;
    if (entrenamiento.tiradas.length > 0) {
      const rondasCompletadas = entrenamiento.tiradas.map(t => t.ronda);
      for (let i = 1; i <= entrenamiento.rondas; i++) {
        if (!rondasCompletadas.includes(i)) {
          rondaActual = i;
          break;
        } else if (i === entrenamiento.rondas) {
          // Todas las rondas están completas
          req.flash('mensajeExito', '¡Has completado todas las rondas! Puedes finalizar el entrenamiento.');
          return res.redirect(`/entrenamientos/${entrenamiento._id}`);
        }
      }
    }

    res.render('entrenamientos/tiradas', {
      entrenamiento,
      rondaActual,
      formatearFecha,
      mensajeExito: req.flash('mensajeExito'),
      mensajeError: req.flash('mensajeError')
    });
  } catch (error) {
    console.error('Error al obtener tiradas del entrenamiento:', error);
    req.flash('mensajeError', 'Error al cargar las tiradas del entrenamiento');
    res.redirect('/entrenamientos');
  }
};

// Registrar una tirada en un entrenamiento
exports.registrarTirada = async (req, res) => {
  try {
    const { ronda } = req.body;
    // Utilizar req.body['puntos[]'] en lugar de req.body.puntos
    const puntos = req.body['puntos[]'];
    
    console.log('Datos recibidos:', { ronda, puntos, body: req.body });
    
    if (!ronda || !puntos) {
      console.log('Error: Faltan datos obligatorios');
      req.flash('mensajeError', 'Todos los campos son obligatorios');
      return res.redirect(`/entrenamientos/${req.params.id}/tiradas`);
    }

    const entrenamiento = await Entrenamiento.findOne({
      _id: req.params.id,
      usuario: req.user.id
    });
    console.log('Entrenamiento encontrado:', entrenamiento);

    if (!entrenamiento) {
      console.log('Error: Entrenamiento no encontrado');
      req.flash('mensajeError', 'Entrenamiento no encontrado');
      return res.redirect('/entrenamientos');
    }

    if (entrenamiento.estado !== 'activo') {
      console.log('Error: Entrenamiento no activo');
      req.flash('mensajeError', 'Este entrenamiento ya ha finalizado y no se pueden registrar más tiradas');
      return res.redirect(`/entrenamientos/${entrenamiento._id}`);
    }

    // Verificar que la ronda no haya sido registrada previamente
    const rondaExistente = entrenamiento.tiradas.find(t => t.ronda === parseInt(ronda));
    if (rondaExistente) {
      console.log('Error: Ronda ya registrada:', ronda);
      req.flash('mensajeError', `La ronda ${ronda} ya ha sido registrada`);
      return res.redirect(`/entrenamientos/${entrenamiento._id}/tiradas`);
    }

    // Convertir los puntos de string a array de números
    const puntosArray = Array.isArray(puntos) ? puntos.map(Number) : [Number(puntos)];
    console.log('Puntos convertidos:', puntosArray);
    
    // Validar que la cantidad de puntos coincida con flechasPorTirada
    if (puntosArray.length !== entrenamiento.flechasPorTirada) {
      console.log('Error: Cantidad incorrecta de flechas:', {
        recibidas: puntosArray.length,
        esperadas: entrenamiento.flechasPorTirada
      });
      req.flash('mensajeError', `Debes registrar exactamente ${entrenamiento.flechasPorTirada} flechas`);
      return res.redirect(`/entrenamientos/${entrenamiento._id}/tiradas`);
    }

    // Validar puntos (entre 0 y 10)
    if (puntosArray.some(p => p < 0 || p > 10)) {
      console.log('Error: Puntos fuera de rango:', puntosArray);
      req.flash('mensajeError', 'Los puntos deben estar entre 0 y 10');
      return res.redirect(`/entrenamientos/${entrenamiento._id}/tiradas`);
    }

    // Calcular total de la tirada
    const total = puntosArray.reduce((sum, punto) => sum + punto, 0);
    console.log('Total calculado:', total);

    // Registrar la tirada
    entrenamiento.tiradas.push({
      ronda: parseInt(ronda),
      puntos: puntosArray,
      total
    });

    console.log('Tirada antes de guardar:', entrenamiento.tiradas[entrenamiento.tiradas.length - 1]);
    
    const entrenamientoGuardado = await entrenamiento.save();
    console.log('Entrenamiento guardado exitosamente. Tiradas:', entrenamientoGuardado.tiradas);

    req.flash('mensajeExito', `¡Tirada de la ronda ${ronda} registrada correctamente!`);
    res.redirect(`/entrenamientos/${entrenamiento._id}/tiradas`);
  } catch (error) {
    console.error('Error detallado al registrar tirada:', error);
    console.error('Stack trace:', error.stack);
    req.flash('mensajeError', 'Error al registrar la tirada');
    res.redirect(`/entrenamientos/${req.params.id}/tiradas`);
  }
};

// Finalizar un entrenamiento
exports.finalizarEntrenamiento = async (req, res) => {
  try {
    const entrenamiento = await Entrenamiento.findById(req.params.id);
    
    if (!entrenamiento) {
      req.flash('mensajeError', 'Entrenamiento no encontrado');
      return res.redirect('/entrenamientos');
    }
    
    // Verificar que el entrenamiento pertenezca al usuario
    if (entrenamiento.usuario.toString() !== req.user._id.toString()) {
      req.flash('mensajeError', 'No tienes permiso para finalizar este entrenamiento');
      return res.redirect('/entrenamientos');
    }
    
    // Verificar que no esté ya finalizado
    if (entrenamiento.estado === 'finalizado') {
      req.flash('mensajeError', 'Este entrenamiento ya ha sido finalizado');
      return res.redirect(`/entrenamientos/${req.params.id}`);
    }
    
    // Verificar si hay al menos una tirada registrada
    if (entrenamiento.tiradas.length === 0) {
      req.flash('mensajeError', 'No puedes finalizar un entrenamiento sin registrar al menos una tirada');
      return res.redirect(`/entrenamientos/${entrenamiento._id}/tiradas`);
    }
    
    // Actualizar estado
    entrenamiento.estado = 'finalizado';
    await entrenamiento.save();
    
    console.log('Registrando actividad de entrenamiento completado...');
    
    // Registrar actividad de entrenamiento completado
    const actividadService = require('../services/actividadService');
    await actividadService.registrarEntrenamientoCompletado(req.user, entrenamiento);
    
    // Verificar y otorgar logros
    const resultado = await verificarLogros(req.user._id, entrenamiento);
    
    let mensajeExito = '¡Entrenamiento finalizado correctamente!';
    
    if (resultado && resultado.logrosDesbloqueados && resultado.logrosDesbloqueados.length > 0) {
      // Mostrar mensaje de logros desbloqueados
      const mensajesLogros = resultado.logrosDesbloqueados.map(logro => 
        `¡Has desbloqueado el logro "${logro.titulo}"!`);
      
      mensajeExito += ` ${mensajesLogros.join(' ')}`;
    }
    
    if (resultado && resultado.subiNivel) {
      mensajeExito += ` ¡Has subido al nivel ${resultado.nivelActual}!`;
    }
    
    req.flash('mensajeExito', mensajeExito);
    res.redirect(`/entrenamientos/${req.params.id}`);
  } catch (error) {
    console.error('Error al finalizar entrenamiento:', error);
    req.flash('mensajeError', 'Error al finalizar el entrenamiento');
    res.redirect(`/entrenamientos/${req.params.id}`);
  }
};

// Eliminar un entrenamiento
exports.eliminarEntrenamiento = async (req, res) => {
  try {
    const entrenamiento = await Entrenamiento.findOne({
      _id: req.params.id,
      usuario: req.user.id
    });

    if (!entrenamiento) {
      req.flash('mensajeError', 'Entrenamiento no encontrado');
      return res.redirect('/entrenamientos');
    }

    await entrenamiento.deleteOne();

    req.flash('mensajeExito', 'Entrenamiento eliminado correctamente');
    res.redirect('/entrenamientos');
  } catch (error) {
    console.error('Error al eliminar entrenamiento:', error);
    req.flash('mensajeError', 'Error al eliminar el entrenamiento');
    res.redirect('/entrenamientos');
  }
};

// Obtener estadísticas detalladas de un entrenamiento
exports.getEstadisticasEntrenamiento = async (req, res) => {
  try {
    const entrenamiento = await Entrenamiento.findOne({
      _id: req.params.id,
      usuario: req.user.id
    }).populate('usuario');

    if (!entrenamiento) {
      req.flash('mensajeError', 'Entrenamiento no encontrado');
      return res.redirect('/entrenamientos');
    }

    // Si no hay tiradas registradas, mostrar la vista con mensaje
    if (entrenamiento.tiradas.length === 0) {
      return res.render('entrenamientos/estadisticas', {
        entrenamiento,
        stats: {},
        formatearFecha,
        mensajeExito: req.flash('mensajeExito'),
        mensajeError: req.flash('mensajeError')
      });
    }

    // Calculamos las estadísticas
    const stats = calcularEstadisticasEntrenamiento(entrenamiento);
    
    // Renderizamos la vista con las estadísticas
    res.render('entrenamientos/estadisticas', {
      entrenamiento,
      stats,
      formatearFecha,
      mensajeExito: req.flash('mensajeExito'),
      mensajeError: req.flash('mensajeError')
    });
  } catch (error) {
    console.error('Error al obtener estadísticas del entrenamiento:', error);
    req.flash('mensajeError', 'Error al cargar las estadísticas del entrenamiento');
    res.redirect('/entrenamientos');
  }
};

// Obtener estadísticas generales de progreso del usuario
exports.getEstadisticasGenerales = async (req, res) => {
  try {
    // Obtener todos los entrenamientos finalizados del usuario
    const entrenamientos = await Entrenamiento.find({
      usuario: req.user.id,
      estado: 'finalizado'
    }).sort({ fecha: 1 }); // Ordenados por fecha para analizar la evolución

    // Si no hay entrenamientos finalizados, mostrar mensaje
    if (entrenamientos.length === 0) {
      // Obtener entrenamientos activos para mostrar en la vista
      const entrenamientosActivos = await Entrenamiento.find({
        usuario: req.user.id,
        estado: 'activo'
      });
      
      return res.render('entrenamientos/evolucion', {
        entrenamientos: entrenamientosActivos,
        stats: {
          totalEntrenamientos: entrenamientosActivos.length,
          entrenamientosFinalizados: 0
        },
        hayEstadisticas: false,
        formatearFecha,
        mensajeExito: req.flash('mensajeExito'),
        mensajeError: req.flash('mensajeError')
      });
    }

    // Calcular estadísticas generales
    const stats = calcularEstadisticasGenerales(entrenamientos);
    
    // Obtener también entrenamientos activos para la lista completa
    const entrenamientosActivos = await Entrenamiento.find({
      usuario: req.user.id,
      estado: 'activo'
    });
    
    // Combinar los dos arrays para la vista
    const todosEntrenamientos = [...entrenamientos, ...entrenamientosActivos]
      .sort((a, b) => new Date(b.fecha) - new Date(a.fecha)); // Más recientes primero
    
    // Renderizar vista con estadísticas
    res.render('entrenamientos/evolucion', {
      title: 'Mi Evolución en Entrenamientos',
      user: req.user,
      stats,
      hayEstadisticas: true,
      entrenamientos,
      formatearFecha,
      mensajeExito: req.flash('mensajeExito'),
      mensajeError: req.flash('mensajeError')
    });
  } catch (error) {
    console.error('Error al obtener estadísticas generales:', error);
    req.flash('mensajeError', 'Error al cargar las estadísticas generales');
    res.redirect('/entrenamientos');
  }
};

// Función auxiliar para calcular estadísticas detalladas
function calcularEstadisticasEntrenamiento(entrenamiento) {
  // Inicializamos objeto de estadísticas
  const stats = {
    puntuacionTotal: 0,
    promedioPorRonda: 0,
    promedioPorFlecha: 0,
    porcentajePrecision: 0,
    mejorTirada: { total: 0, ronda: 0, puntos: [] },
    peorTirada: { total: 100, ronda: 0, puntos: [] },
    distribucionPuntos: Array(11).fill(0),
    totalFlechas: 0,
    porcentajesPorCategoria: {
      excelente: 0, // 9-10
      bueno: 0,     // 7-8
      regular: 0,   // 5-6
      bajo: 0,      // 3-4
      fallo: 0      // 0-2
    },
    desviacionEstandar: 0,
    tendencia: 0,
    tiradas: entrenamiento.tiradas
  };

  // Si no hay tiradas, retornamos el objeto vacío
  if (entrenamiento.tiradas.length === 0) {
    return stats;
  }

  // Puntuación total
  stats.puntuacionTotal = entrenamiento.tiradas.reduce((sum, tirada) => sum + tirada.total, 0);

  // Promedio por ronda
  stats.promedioPorRonda = parseFloat((stats.puntuacionTotal / entrenamiento.tiradas.length).toFixed(1));

  // Mejor y peor tirada
  entrenamiento.tiradas.forEach(tirada => {
    // Actualizar distribución de puntos
    tirada.puntos.forEach(punto => {
      stats.distribucionPuntos[punto]++;
      stats.totalFlechas++;

      // Actualizar categorías
      if (punto >= 9) stats.porcentajesPorCategoria.excelente++;
      else if (punto >= 7) stats.porcentajesPorCategoria.bueno++;
      else if (punto >= 5) stats.porcentajesPorCategoria.regular++;
      else if (punto >= 3) stats.porcentajesPorCategoria.bajo++;
      else stats.porcentajesPorCategoria.fallo++;
    });

    // Actualizar mejor tirada
    if (tirada.total > stats.mejorTirada.total) {
      stats.mejorTirada = {
        total: tirada.total,
        ronda: tirada.ronda,
        puntos: [...tirada.puntos]
      };
    }

    // Actualizar peor tirada
    if (tirada.total < stats.peorTirada.total) {
      stats.peorTirada = {
        total: tirada.total,
        ronda: tirada.ronda,
        puntos: [...tirada.puntos]
      };
    }
  });

  // Promedio por flecha
  stats.promedioPorFlecha = parseFloat((stats.puntuacionTotal / stats.totalFlechas).toFixed(1));

  // Porcentaje de precisión (flechas de 7-10 puntos)
  const flechasAlta = stats.distribucionPuntos.slice(7).reduce((sum, count) => sum + count, 0);
  stats.porcentajePrecision = parseFloat(((flechasAlta / stats.totalFlechas) * 100).toFixed(1));

  // Convertir conteos a porcentajes
  Object.keys(stats.porcentajesPorCategoria).forEach(categoria => {
    const count = stats.porcentajesPorCategoria[categoria];
    stats.porcentajesPorCategoria[categoria] = parseFloat(((count / stats.totalFlechas) * 100).toFixed(1));
  });

  // Calcular desviación estándar (consistencia)
  if (entrenamiento.tiradas.length > 1) {
    // Array con todos los puntos
    const todosPuntos = [];
    entrenamiento.tiradas.forEach(tirada => {
      todosPuntos.push(...tirada.puntos);
    });
    
    // Calcular la media
    const media = stats.promedioPorFlecha;
    
    // Calcular suma de cuadrados de las diferencias
    const sumaCuadrados = todosPuntos.reduce((sum, punto) => {
      return sum + Math.pow(punto - media, 2);
    }, 0);
    
    // Calcular desviación estándar
    stats.desviacionEstandar = parseFloat(Math.sqrt(sumaCuadrados / todosPuntos.length).toFixed(2));
  }

  // Calcular tendencia (regresión lineal simple)
  if (entrenamiento.tiradas.length > 1) {
    const tiradasOrdenadas = [...entrenamiento.tiradas].sort((a, b) => a.ronda - b.ronda);
    
    // Calcular pendiente usando mínimos cuadrados
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
    const n = tiradasOrdenadas.length;
    
    tiradasOrdenadas.forEach((tirada, index) => {
      const x = index + 1; // posición (1, 2, 3...)
      const y = tirada.total; // puntuación total
      
      sumX += x;
      sumY += y;
      sumXY += x * y;
      sumX2 += x * x;
    });
    
    // Fórmula de la pendiente: m = (n*sumXY - sumX*sumY) / (n*sumX2 - sumX^2)
    const pendiente = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    stats.tendencia = parseFloat(pendiente.toFixed(2));
  }

  return stats;
}

// Función auxiliar para calcular estadísticas generales
function calcularEstadisticasGenerales(entrenamientos) {
  const stats = {
    totalEntrenamientos: entrenamientos.length,
    entrenamientosFinalizados: entrenamientos.length,
    totalFlechas: 0,
    puntuacionTotal: 0,
    promedioPorFlecha: 0,
    promedioPorEntrenamiento: 0,
    mejorPromedio: 0,
    peorPromedio: 100,
    porcentajeMejora: 0,
    porcentajeAciertos: 0,
    distribucionPorDistancia: {},
    evolucionPromedio: [],
    evolucionPorDistancia: {},
    primerEntrenamiento: null,
    ultimoEntrenamiento: null,
    // Nuevas estadísticas
    tendenciaGeneral: 0,
    consistencia: 0,
    mejorSesion: null,
    peorSesion: null,
    promedioUltimos3: 0,
    comparacionConPromedio: 0
  };

  if (entrenamientos.length === 0) return stats;

  // Extraer primer y último entrenamiento
  stats.primerEntrenamiento = entrenamientos[0];
  stats.ultimoEntrenamiento = entrenamientos[entrenamientos.length - 1];

  let todosLosPromedios = [];
  let sumaTotalPuntos = 0;
  let sumaTotalFlechas = 0;

  // Calcular estadísticas acumuladas
  entrenamientos.forEach(entrenamiento => {
    let totalPuntos = 0;
    let totalFlechas = 0;
    let puntosAltos = 0;

    entrenamiento.tiradas.forEach(tirada => {
      totalPuntos += tirada.total;
      totalFlechas += tirada.puntos.length;
      tirada.puntos.forEach(punto => {
        if (punto >= 7) puntosAltos++;
      });
    });

    const promedioEntrenamiento = totalFlechas > 0 ? totalPuntos / totalFlechas : 0;
    todosLosPromedios.push(promedioEntrenamiento);
    sumaTotalPuntos += totalPuntos;
    sumaTotalFlechas += totalFlechas;

    // Actualizar mejor y peor sesión
    if (!stats.mejorSesion || promedioEntrenamiento > stats.mejorSesion.promedio) {
      stats.mejorSesion = {
        fecha: entrenamiento.fecha,
        promedio: promedioEntrenamiento,
        distancia: entrenamiento.distancia,
        totalPuntos,
        totalFlechas
      };
    }
    if (!stats.peorSesion || (promedioEntrenamiento < stats.peorSesion.promedio && promedioEntrenamiento > 0)) {
      stats.peorSesion = {
        fecha: entrenamiento.fecha,
        promedio: promedioEntrenamiento,
        distancia: entrenamiento.distancia,
        totalPuntos,
        totalFlechas
      };
    }

    // Actualizar estadísticas por distancia
    const distancia = entrenamiento.distancia;
    if (!stats.distribucionPorDistancia[distancia]) {
      stats.distribucionPorDistancia[distancia] = {
        entrenamientos: 0,
        puntuacionTotal: 0,
        totalFlechas: 0,
        promedio: 0,
        mejorPromedio: 0,
        peorPromedio: 100
      };
    }

    const distanciaStats = stats.distribucionPorDistancia[distancia];
    distanciaStats.entrenamientos++;
    distanciaStats.puntuacionTotal += totalPuntos;
    distanciaStats.totalFlechas += totalFlechas;
    distanciaStats.mejorPromedio = Math.max(distanciaStats.mejorPromedio, promedioEntrenamiento);
    if (promedioEntrenamiento > 0) {
      distanciaStats.peorPromedio = Math.min(distanciaStats.peorPromedio, promedioEntrenamiento);
    }

    // Datos para gráficos de evolución
    stats.evolucionPromedio.push({
      fecha: entrenamiento.fecha,
      promedio: promedioEntrenamiento,
      distancia: entrenamiento.distancia,
      totalPuntos,
      totalFlechas,
      mejoresTiradas: entrenamiento.tiradas
        .map(t => t.puntos)
        .flat()
        .filter(p => p >= 8).length
    });

    if (!stats.evolucionPorDistancia[distancia]) {
      stats.evolucionPorDistancia[distancia] = [];
    }
    stats.evolucionPorDistancia[distancia].push({
      fecha: entrenamiento.fecha,
      promedio: promedioEntrenamiento,
      totalPuntos,
      totalFlechas
    });
  });

  // Calcular promedios globales
  stats.totalFlechas = sumaTotalFlechas;
  stats.puntuacionTotal = sumaTotalPuntos;
  stats.promedioPorFlecha = sumaTotalFlechas > 0 ? sumaTotalPuntos / sumaTotalFlechas : 0;
  stats.promedioPorEntrenamiento = entrenamientos.length > 0 ? sumaTotalPuntos / entrenamientos.length : 0;

  // Calcular consistencia (desviación estándar)
  if (todosLosPromedios.length > 1) {
    const media = todosLosPromedios.reduce((a, b) => a + b) / todosLosPromedios.length;
    const varianza = todosLosPromedios.reduce((a, b) => a + Math.pow(b - media, 2), 0) / todosLosPromedios.length;
    stats.consistencia = Math.sqrt(varianza);
  }

  // Calcular tendencia general (usando regresión lineal simple)
  if (todosLosPromedios.length > 1) {
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
    const n = todosLosPromedios.length;
    
    todosLosPromedios.forEach((promedio, index) => {
      sumX += index;
      sumY += promedio;
      sumXY += index * promedio;
      sumX2 += index * index;
    });
    
    stats.tendenciaGeneral = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  }

  // Calcular promedio de los últimos 3 entrenamientos
  if (todosLosPromedios.length >= 3) {
    const ultimos3 = todosLosPromedios.slice(-3);
    stats.promedioUltimos3 = ultimos3.reduce((a, b) => a + b) / ultimos3.length;
    stats.comparacionConPromedio = stats.promedioUltimos3 - stats.promedioPorFlecha;
  }

  // Calcular promedios por distancia y redondear valores
  Object.keys(stats.distribucionPorDistancia).forEach(distancia => {
    const datos = stats.distribucionPorDistancia[distancia];
    datos.promedio = datos.totalFlechas > 0 ? datos.puntuacionTotal / datos.totalFlechas : 0;
    
    // Redondear valores
    datos.promedio = parseFloat(datos.promedio.toFixed(2));
    datos.mejorPromedio = parseFloat(datos.mejorPromedio.toFixed(2));
    datos.peorPromedio = datos.peorPromedio === 100 ? 0 : parseFloat(datos.peorPromedio.toFixed(2));
  });

  // Redondear valores finales
  stats.promedioPorFlecha = parseFloat(stats.promedioPorFlecha.toFixed(2));
  stats.promedioPorEntrenamiento = parseFloat(stats.promedioPorEntrenamiento.toFixed(2));
  stats.consistencia = parseFloat(stats.consistencia.toFixed(2));
  stats.tendenciaGeneral = parseFloat(stats.tendenciaGeneral.toFixed(2));
  stats.promedioUltimos3 = parseFloat(stats.promedioUltimos3.toFixed(2));
  stats.comparacionConPromedio = parseFloat(stats.comparacionConPromedio.toFixed(2));

  if (stats.mejorSesion) {
    stats.mejorSesion.promedio = parseFloat(stats.mejorSesion.promedio.toFixed(2));
  }
  if (stats.peorSesion) {
    stats.peorSesion.promedio = parseFloat(stats.peorSesion.promedio.toFixed(2));
  }

  // Ordenar datos de evolución por fecha
  stats.evolucionPromedio.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
  Object.values(stats.evolucionPorDistancia).forEach(datos => {
    datos.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
  });

  return stats;
} 