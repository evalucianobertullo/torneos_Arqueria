const Entrenamiento = require('../models/Entrenamiento');
const User = require('../models/User');

/**
 * Obtener ranking de promedios por distancia filtrado por mes
 * @param {Number} mes - Mes (1-12)
 * @param {Number} anio - Año
 * @returns {Promise<Object>} Ranking por distancias
 */
exports.obtenerRankingPromedios = async (mes, anio) => {
  try {
    // Si no se proporciona mes o año, usar el mes actual
    if (!mes || !anio) {
      const fechaActual = new Date();
      mes = mes || fechaActual.getMonth() + 1; // getMonth() devuelve 0-11
      anio = anio || fechaActual.getFullYear();
    }
    
    // Crear fechas de inicio y fin del mes
    const fechaInicio = new Date(anio, mes - 1, 1); // Mes en JS es 0-indexed
    const fechaFin = new Date(anio, mes, 0); // El día 0 del siguiente mes es el último día del mes actual
    
    // Obtener entrenamientos finalizados del mes especificado
    const entrenamientos = await Entrenamiento.find({
      estado: 'finalizado',
      fecha: { $gte: fechaInicio, $lte: fechaFin }
    }).populate('usuario', 'nombre apellido tipoArco');

    // Agrupar por distancia
    const rankingPorDistancia = {};

    entrenamientos.forEach(entrenamiento => {
      // Solo procesar entrenamientos con más de 2 flechas por ronda
      const flechasPorRonda = entrenamiento.tiradas.reduce((acc, tirada) => {
        return acc + (tirada.puntos ? tirada.puntos.length : 0);
      }, 0) / entrenamiento.tiradas.length;

      if (flechasPorRonda <= 2) return;

      const distancia = entrenamiento.distancia;
      if (!rankingPorDistancia[distancia]) {
        rankingPorDistancia[distancia] = {};
      }

      // Calcular promedio del entrenamiento
      const totalPuntos = entrenamiento.tiradas.reduce((sum, tirada) => {
        return sum + (tirada.puntos ? tirada.puntos.reduce((a, b) => a + b, 0) : 0);
      }, 0);

      const totalFlechas = entrenamiento.tiradas.reduce((sum, tirada) => {
        return sum + (tirada.puntos ? tirada.puntos.length : 0);
      }, 0);

      const promedio = totalFlechas > 0 ? totalPuntos / totalFlechas : 0;

      // Actualizar promedio del arquero para esta distancia
      const userId = entrenamiento.usuario._id.toString();
      if (!rankingPorDistancia[distancia][userId]) {
        rankingPorDistancia[distancia][userId] = {
          usuario: {
            _id: entrenamiento.usuario._id,
            nombre: entrenamiento.usuario.nombre,
            apellido: entrenamiento.usuario.apellido,
            tipoArco: entrenamiento.usuario.tipoArco
          },
          totalPuntos: 0,
          totalFlechas: 0,
          entrenamientos: 0
        };
      }

      rankingPorDistancia[distancia][userId].totalPuntos += totalPuntos;
      rankingPorDistancia[distancia][userId].totalFlechas += totalFlechas;
      rankingPorDistancia[distancia][userId].entrenamientos += 1;
    });

    // Convertir a formato de ranking y ordenar por promedio
    const rankingFinal = {};
    Object.keys(rankingPorDistancia).forEach(distancia => {
      rankingFinal[distancia] = Object.values(rankingPorDistancia[distancia])
        .map(datos => ({
          usuario: datos.usuario,
          promedio: (datos.totalPuntos / datos.totalFlechas).toFixed(2),
          totalFlechas: datos.totalFlechas,
          entrenamientos: datos.entrenamientos
        }))
        .sort((a, b) => b.promedio - a.promedio)
        .slice(0, 10); // Top 10 por distancia
    });

    return rankingFinal;
  } catch (error) {
    console.error('Error al obtener ranking de promedios:', error);
    throw error;
  }
}; 