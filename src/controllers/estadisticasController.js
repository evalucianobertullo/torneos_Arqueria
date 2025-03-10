const Entrenamiento = require('../models/Entrenamiento');
const User = require('../models/User');
const entrenamientoService = require('../services/entrenamientoService');

/**
 * Mostrar página de rankings
 */
exports.getRankings = async (req, res) => {
  try {
    // Obtener mes y año de la consulta o usar el mes actual
    let mes = req.query.mes ? parseInt(req.query.mes) : new Date().getMonth() + 1;
    let anio = req.query.anio ? parseInt(req.query.anio) : new Date().getFullYear();
    
    // Validar mes y año
    if (mes < 1 || mes > 12) mes = new Date().getMonth() + 1;
    if (anio < 2000 || anio > 2100) anio = new Date().getFullYear();
    
    // Obtener el ranking para el mes y año especificados
    const ranking = await entrenamientoService.obtenerRankingPromedios(mes, anio);
    
    // Generar lista de meses para el selector
    const meses = [
      { valor: 1, nombre: 'Enero' },
      { valor: 2, nombre: 'Febrero' },
      { valor: 3, nombre: 'Marzo' },
      { valor: 4, nombre: 'Abril' },
      { valor: 5, nombre: 'Mayo' },
      { valor: 6, nombre: 'Junio' },
      { valor: 7, nombre: 'Julio' },
      { valor: 8, nombre: 'Agosto' },
      { valor: 9, nombre: 'Septiembre' },
      { valor: 10, nombre: 'Octubre' },
      { valor: 11, nombre: 'Noviembre' },
      { valor: 12, nombre: 'Diciembre' }
    ];
    
    // Generar lista de años (desde 2020 hasta el año actual)
    const anioActual = new Date().getFullYear();
    const anios = [];
    for (let a = 2020; a <= anioActual; a++) {
      anios.push(a);
    }
    
    res.render('admin/rankings', {
      title: 'Rankings por Distancia',
      ranking,
      mes,
      anio,
      meses,
      anios,
      nombreMes: meses.find(m => m.valor === mes).nombre,
      mensajeExito: req.flash('mensajeExito'),
      mensajeError: req.flash('mensajeError')
    });
  } catch (error) {
    console.error('Error al obtener rankings:', error);
    req.flash('mensajeError', 'Error al cargar los rankings');
    res.redirect('/dashboard');
  }
};

/**
 * Obtener estadísticas detalladas de un arquero
 */
exports.getEstadisticasArquero = async (req, res) => {
  try {
    const userId = req.params.userId;
    const usuario = await User.findById(userId);
    
    if (!usuario) {
      req.flash('mensajeError', 'Usuario no encontrado');
      return res.redirect('/admin/rankings');
    }

    // Obtener todos los entrenamientos del arquero
    const entrenamientos = await Entrenamiento.find({
      usuario: userId,
      estado: 'finalizado'
    }).sort({ fecha: -1 });

    // Agrupar entrenamientos por distancia
    const estadisticasPorDistancia = {};
    entrenamientos.forEach(entrenamiento => {
      const distancia = entrenamiento.distancia;
      if (!estadisticasPorDistancia[distancia]) {
        estadisticasPorDistancia[distancia] = {
          entrenamientos: [],
          promedioGeneral: 0,
          mejorPromedio: 0,
          totalFlechas: 0,
          progresion: []
        };
      }

      // Calcular promedio del entrenamiento
      const totalPuntos = entrenamiento.tiradas.reduce((sum, tirada) => 
        sum + (tirada.puntos ? tirada.puntos.reduce((a, b) => a + b, 0) : 0), 0);
      const totalFlechas = entrenamiento.tiradas.reduce((sum, tirada) => 
        sum + (tirada.puntos ? tirada.puntos.length : 0), 0);
      const promedio = totalFlechas > 0 ? totalPuntos / totalFlechas : 0;

      // Actualizar estadísticas
      estadisticasPorDistancia[distancia].entrenamientos.push({
        fecha: entrenamiento.fecha,
        promedio: promedio.toFixed(2),
        totalPuntos,
        totalFlechas,
        tiradas: entrenamiento.tiradas
      });

      // Actualizar mejor promedio
      if (promedio > estadisticasPorDistancia[distancia].mejorPromedio) {
        estadisticasPorDistancia[distancia].mejorPromedio = promedio;
      }

      // Añadir a la progresión
      estadisticasPorDistancia[distancia].progresion.push({
        fecha: entrenamiento.fecha,
        promedio: promedio.toFixed(2)
      });

      // Actualizar totales
      estadisticasPorDistancia[distancia].totalFlechas += totalFlechas;
    });

    // Calcular promedios generales
    Object.keys(estadisticasPorDistancia).forEach(distancia => {
      const stats = estadisticasPorDistancia[distancia];
      const totalPuntos = stats.entrenamientos.reduce((sum, e) => sum + e.totalPuntos, 0);
      stats.promedioGeneral = (totalPuntos / stats.totalFlechas).toFixed(2);
      stats.mejorPromedio = stats.mejorPromedio.toFixed(2);
      
      // Ordenar progresión por fecha
      stats.progresion.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
    });

    res.render('admin/estadisticas-arquero', {
      title: `Estadísticas de ${usuario.nombre} ${usuario.apellido}`,
      usuario,
      estadisticas: estadisticasPorDistancia,
      formatearFecha: require('../utils/helpers').formatearFecha,
      mensajeExito: req.flash('mensajeExito'),
      mensajeError: req.flash('mensajeError')
    });
  } catch (error) {
    console.error('Error al obtener estadísticas del arquero:', error);
    req.flash('mensajeError', 'Error al cargar las estadísticas');
    res.redirect('/admin/rankings');
  }
}; 