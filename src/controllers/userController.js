const User = require('../models/User');
const Torneo = require('../models/Torneo');

// Ver perfil del usuario
exports.getProfile = async (req, res) => {
  try {
    // Obtener todos los torneos finalizados donde el usuario ha participado
    const torneos = await Torneo.find({
      'participantes.usuario': req.user.id,
      'participantes.estado': 'aceptado',
      'estado': 'finalizado'  // Solo torneos finalizados
    }).populate('creador', 'nombre apellido');

    // Calcular estadísticas generales
    const stats = {
      torneosParticipados: 0,
      torneosGanados: 0,
      segundosLugares: 0,
      tercerosLugares: 0,
      puntuacionTotal: 0,
      totalTiradas: 0,
      mejorPuntuacion: 0,
      promedioGeneral: 0,
      distribucionPuntos: Array(11).fill(0), // Para contar flechas de 0 a 10 puntos
      ultimosTorneos: []
    };

    // Procesar cada torneo para calcular estadísticas
    torneos.forEach(torneo => {
      // Encontrar al participante actual en el torneo
      const participante = torneo.participantes.find(
        p => p.usuario.toString() === req.user.id && p.estado === 'aceptado'
      );

      if (participante && participante.tiradas.length > 0) {  // Solo si tiene tiradas registradas
        stats.torneosParticipados++;
        stats.puntuacionTotal += participante.puntuacion;
        stats.totalTiradas += participante.tiradas.length;

        // Actualizar mejor puntuación
        const puntuacionPromedio = participante.puntuacion / participante.tiradas.length;
        stats.mejorPuntuacion = Math.max(stats.mejorPuntuacion, puntuacionPromedio);

        // Contar distribución de puntos
        participante.tiradas.forEach(tirada => {
          tirada.puntos.forEach(punto => {
            if (punto >= 0 && punto <= 10) {  // Validación adicional
              stats.distribucionPuntos[punto]++;
            }
          });
        });

        // Determinar posición en el torneo
        const participantesOrdenados = [...torneo.participantes]
          .filter(p => p.estado === 'aceptado' && p.tiradas.length > 0)  // Solo participantes con tiradas
          .sort((a, b) => b.puntuacion - a.puntuacion);

        const posicion = participantesOrdenados.findIndex(
          p => p.usuario.toString() === req.user.id
        ) + 1;

        // Contar podios
        if (posicion === 1) stats.torneosGanados++;
        if (posicion === 2) stats.segundosLugares++;
        if (posicion === 3) stats.tercerosLugares++;

        // Guardar información para los últimos torneos
        stats.ultimosTorneos.push({
          nombre: torneo.nombre,
          fecha: torneo.fecha,
          estado: torneo.estado,
          posicion,
          puntuacion: participante.puntuacion,
          promedio: puntuacionPromedio.toFixed(1)
        });
      }
    });

    // Calcular promedio general
    stats.promedioGeneral = stats.totalTiradas > 0 
      ? (stats.puntuacionTotal / stats.totalTiradas).toFixed(1) 
      : 0;

    // Ordenar últimos torneos por fecha
    stats.ultimosTorneos.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

    // Limitar a los últimos 5 torneos
    stats.ultimosTorneos = stats.ultimosTorneos.slice(0, 5);

    // Renderizar la vista del perfil
    res.render('users/profile', {
      title: 'Mi Perfil',
      user: req.user,
      stats
    });
  } catch (error) {
    console.error('Error al cargar el perfil:', error);
    req.flash('error_msg', 'Error al cargar el perfil');
    res.redirect('/dashboard');
  }
}; 