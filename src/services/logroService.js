const Logro = require('../models/Logro');
const LogroUsuario = require('../models/LogroUsuario');
const User = require('../models/User');
const mongoose = require('mongoose');
const { registrarLogroDesbloqueado, registrarNivelAlcanzado } = require('./actividadService');

/**
 * Inicializar los logros en la base de datos
 */
exports.inicializarLogros = async () => {
  try {
    console.log('Comprobando existencia de logros en la base de datos...');
    const logrosExistentes = await Logro.countDocuments();
    console.log(`Se encontraron ${logrosExistentes} logros existentes`);
    
    if (logrosExistentes === 0) {
      console.log('No se encontraron logros. Inicializando logros predefinidos...');
      const logrosIniciales = [
        // SECCIÓN 1: LOGROS DE ENTRENAMIENTO (2 fáciles, 1 difícil)
        // Fácil 1
        {
          titulo: 'Primer paso',
          descripcion: 'Completaste tu primer entrenamiento',
          icono: 'fa-bullseye',
          tipo: 'entrenamiento',
          requisito: 1,
          nivel: 1,
          puntos_exp: 10
        },
        // Fácil 2
        {
          titulo: 'Arquero dedicado',
          descripcion: 'Completaste 5 entrenamientos',
          icono: 'fa-award',
          tipo: 'entrenamiento',
          requisito: 5,
          nivel: 1,
          puntos_exp: 20
        },
        // Difícil 1
        {
          titulo: 'Maestro del arco',
          descripcion: 'Completaste 20 entrenamientos',
          icono: 'fa-crown',
          tipo: 'entrenamiento',
          requisito: 20,
          nivel: 2,
          puntos_exp: 50
        },
        
        // NUEVOS LOGROS: ENTRENAMIENTO COMPLETADOS (2 fáciles, 1 difícil)
        // Fácil 3
        {
          titulo: 'Práctica constante',
          descripcion: 'Completaste 30 entrenamientos',
          icono: 'fa-bullseye',
          tipo: 'entrenamiento',
          requisito: 30,
          nivel: 2,
          puntos_exp: 60
        },
        // Fácil 4
        {
          titulo: 'Arquero experimentado',
          descripcion: 'Completaste 50 entrenamientos',
          icono: 'fa-award',
          tipo: 'entrenamiento',
          requisito: 50,
          nivel: 3,
          puntos_exp: 80
        },
        // Difícil 2
        {
          titulo: 'Leyenda del tiro',
          descripcion: 'Completaste 100 entrenamientos',
          icono: 'fa-crown',
          tipo: 'entrenamiento',
          requisito: 100,
          nivel: 4,
          puntos_exp: 150
        },
        
        // SECCIÓN 2: LOGROS DE FLECHAS (PUNTUACIÓN) (2 fáciles, 1 difícil)
        // Fácil 5
        {
          titulo: 'Primera centena',
          descripcion: 'Lanzaste 100 flechas en total',
          icono: 'fa-arrows-alt',
          tipo: 'puntaje',
          requisito: 100,
          nivel: 1,
          puntos_exp: 15
        },
        // Fácil 6
        {
          titulo: 'Arquero experimentado',
          descripcion: 'Lanzaste 500 flechas en total',
          icono: 'fa-bullseye',
          tipo: 'puntaje',
          requisito: 500,
          nivel: 2,
          puntos_exp: 40
        },
        // Difícil 3
        {
          titulo: 'Lluvia de flechas',
          descripcion: 'Lanzaste 1000 flechas en total',
          icono: 'fa-haykal',
          tipo: 'puntaje',
          requisito: 1000,
          nivel: 3,
          puntos_exp: 75
        },
        
        // NUEVOS LOGROS: FLECHAS LANZADAS (2 fáciles, 1 difícil)
        // Fácil 7
        {
          titulo: 'Tormenta de flechas',
          descripcion: 'Lanzaste 2000 flechas en total',
          icono: 'fa-wind',
          tipo: 'puntaje',
          requisito: 2000,
          nivel: 3,
          puntos_exp: 100
        },
        // Fácil 8
        {
          titulo: 'Arsenal completo',
          descripcion: 'Lanzaste 3500 flechas en total',
          icono: 'fa-quiver',
          tipo: 'puntaje',
          requisito: 3500,
          nivel: 4,
          puntos_exp: 125
        },
        // Difícil 4
        {
          titulo: 'Arquero legendario',
          descripcion: 'Lanzaste 5000 flechas en total',
          icono: 'fa-bow-arrow',
          tipo: 'puntaje',
          requisito: 5000,
          nivel: 5,
          puntos_exp: 200
        },
        
        // SECCIÓN 3: LOGROS DE PRECISIÓN (PROMEDIOS) (2 fáciles, 1 difícil)
        // Fácil 9
        {
          titulo: 'Buen ojo',
          descripcion: 'Consigue un promedio de 7+ en un entrenamiento',
          icono: 'fa-eye',
          tipo: 'consistencia',
          requisito: 7,
          nivel: 1,
          puntos_exp: 25
        },
        // Fácil 10
        {
          titulo: 'Precisión de experto',
          descripcion: 'Consigue un promedio de 8+ en un entrenamiento',
          icono: 'fa-crosshairs',
          tipo: 'consistencia',
          requisito: 8,
          nivel: 2,
          puntos_exp: 50
        },
        // Difícil 5
        {
          titulo: 'Precisión legendaria',
          descripcion: 'Consigue un promedio de 9+ en un entrenamiento',
          icono: 'fa-star',
          tipo: 'consistencia',
          requisito: 9,
          nivel: 3,
          puntos_exp: 100
        },
        
        // NUEVOS LOGROS: PRECISIÓN AVANZADA (2 fáciles, 1 difícil)
        // Fácil 11
        {
          titulo: 'Tirador selecto',
          descripcion: 'Consigue 3 dieces en un mismo entrenamiento',
          icono: 'fa-bullseye',
          tipo: 'consistencia',
          requisito: 3,
          nivel: 2,
          puntos_exp: 40
        },
        // Fácil 12
        {
          titulo: 'Francotirador',
          descripcion: 'Consigue 5 dieces en un mismo entrenamiento',
          icono: 'fa-crosshairs',
          tipo: 'consistencia',
          requisito: 5,
          nivel: 3,
          puntos_exp: 70
        },
        // Difícil 6
        {
          titulo: 'Robin Hood',
          descripcion: 'Consigue 10 dieces en un mismo entrenamiento',
          icono: 'fa-crown',
          tipo: 'consistencia',
          requisito: 10,
          nivel: 4,
          puntos_exp: 150
        },
        
        // SECCIÓN 4: LOGROS DE CONSTANCIA (2 fáciles, 1 difícil)
        // Fácil 13
        {
          titulo: 'Constancia',
          descripcion: 'Realiza entrenamientos 2 días consecutivos',
          icono: 'fa-calendar-check',
          tipo: 'experiencia',
          requisito: 2,
          nivel: 1,
          puntos_exp: 15
        },
        // Fácil 14
        {
          titulo: 'Disciplina',
          descripcion: 'Realiza entrenamientos 5 días consecutivos',
          icono: 'fa-calendar-alt',
          tipo: 'experiencia',
          requisito: 5,
          nivel: 2,
          puntos_exp: 40
        },
        // Difícil 7
        {
          titulo: 'Rutina implacable',
          descripcion: 'Realiza entrenamientos 14 días consecutivos',
          icono: 'fa-calendar-week',
          tipo: 'experiencia',
          requisito: 14,
          nivel: 4,
          puntos_exp: 120
        },
        
        // NUEVA CATEGORÍA: LOGROS DE DISTANCIA (2 fáciles, 1 difícil)
        // Fácil 15
        {
          titulo: 'Tiro corto',
          descripcion: 'Completa 5 entrenamientos a 10 metros',
          icono: 'fa-ruler-horizontal',
          tipo: 'experiencia',
          requisito: 5,
          nivel: 1,
          puntos_exp: 20
        },
        // Fácil 16
        {
          titulo: 'Distancia media',
          descripcion: 'Completa 5 entrenamientos a 18 metros',
          icono: 'fa-ruler',
          tipo: 'experiencia',
          requisito: 5,
          nivel: 2,
          puntos_exp: 35
        },
        // Difícil 8
        {
          titulo: 'Larga distancia',
          descripcion: 'Completa 5 entrenamientos a 30 metros o más',
          icono: 'fa-ruler-combined',
          tipo: 'experiencia',
          requisito: 5,
          nivel: 3,
          puntos_exp: 80
        },
        
        // NUEVA CATEGORÍA: DESEMPEÑO TOTAL (2 fáciles, 1 difícil)
        // Fácil 17
        {
          titulo: 'Primera victoria',
          descripcion: 'Alcanza un total de 100 puntos en un solo entrenamiento',
          icono: 'fa-award',
          tipo: 'puntaje',
          requisito: 100,
          nivel: 1,
          puntos_exp: 30
        },
        // Fácil 18
        {
          titulo: 'Arquero de élite',
          descripcion: 'Alcanza un total de 200 puntos en un solo entrenamiento',
          icono: 'fa-medal',
          tipo: 'puntaje',
          requisito: 200,
          nivel: 2,
          puntos_exp: 60
        },
        // Difícil 9
        {
          titulo: 'Maestría perfecta',
          descripcion: 'Alcanza un total de 300 puntos en un solo entrenamiento',
          icono: 'fa-trophy',
          tipo: 'puntaje',
          requisito: 300,
          nivel: 3,
          puntos_exp: 130
        },
        
        // NUEVA CATEGORÍA: LOGROS DE RONDAS (2 fáciles, 1 difícil)
        // Fácil 19
        {
          titulo: 'Ronda perfecta',
          descripcion: 'Consigue una ronda con todas las flechas 8+',
          icono: 'fa-check-circle',
          tipo: 'consistencia',
          requisito: 1,
          nivel: 2,
          puntos_exp: 45
        },
        // Fácil 20
        {
          titulo: 'Francotirador',
          descripcion: 'Consigue una ronda con 3 dieces consecutivos',
          icono: 'fa-angle-double-up',
          tipo: 'consistencia',
          requisito: 3,
          nivel: 3,
          puntos_exp: 75
        },
        // Difícil 10
        {
          titulo: 'Perfección absoluta',
          descripcion: 'Consigue una ronda completa con solo dieces',
          icono: 'fa-star',
          tipo: 'consistencia',
          requisito: 6,
          nivel: 5,
          puntos_exp: 200
        }
      ];
      
      console.log(`Insertando ${logrosIniciales.length} logros predefinidos...`);
      const resultado = await Logro.insertMany(logrosIniciales);
      console.log(`✅ Logros inicializados correctamente: ${resultado.length} logros insertados`);
      return resultado;
    } else {
      console.log('Ya existen logros en la base de datos. No es necesario inicializarlos.');
      return await Logro.find();
    }
  } catch (error) {
    console.error('ERROR al inicializar logros:', error);
    throw error;
  }
};

/**
 * Verificar y otorgar logros al usuario
 * @param {String} userId - ID del usuario
 * @param {Object} entrenamiento - Objeto del entrenamiento (opcional)
 */
exports.verificarLogros = async (userId, entrenamiento = null) => {
  const user = await User.findById(userId);
  if (!user) return null;
  
  const logrosDesbloqueados = [];
  const nivelInicial = user.nivel;
  
  // 1. Verificar logros de entrenamientos totales
  if (entrenamiento && entrenamiento.estado === 'finalizado') {
    // Actualizar contadores del usuario
    user.total_entrenamientos += 1;
    
    // Calcular entrenamientos consecutivos
    const hoy = new Date();
    const ultimaFecha = user.ultima_fecha_entrenamiento;
    
    if (ultimaFecha) {
      const diferenciaDias = Math.floor((hoy - new Date(ultimaFecha)) / (1000 * 60 * 60 * 24));
      
      if (diferenciaDias <= 1) {
        // Si entrenó ayer o hoy, incrementar consecutivos
        user.entrenamientos_consecutivos += 1;
      } else {
        // Reiniciar contador si pasó más de un día
        user.entrenamientos_consecutivos = 1;
      }
    } else {
      user.entrenamientos_consecutivos = 1;
    }
    
    user.ultima_fecha_entrenamiento = hoy;
    
    // Actualizar total de flechas lanzadas
    const flechasEnEntrenamiento = entrenamiento.tiradas.reduce((total, tirada) => {
      return total + tirada.puntos.length;
    }, 0);
    
    user.total_flechas_lanzadas += flechasEnEntrenamiento;
    
    // Verificar logros de entrenamiento
    const logrosEntrenamiento = await Logro.find({
      tipo: 'entrenamiento',
      requisito: { $lte: user.total_entrenamientos }
    });
    
    for (const logro of logrosEntrenamiento) {
      const logroYaObtenido = await LogroUsuario.findOne({
        usuario: userId,
        logro: logro._id
      });
      
      if (!logroYaObtenido) {
        // Otorgar logro
        const nuevoLogroUsuario = new LogroUsuario({
          usuario: userId,
          logro: logro._id
        });
        
        await nuevoLogroUsuario.save();
        logrosDesbloqueados.push(logro);
        
        // Dar experiencia
        user.experiencia += logro.puntos_exp;
        await registrarLogroDesbloqueado(user, logro);
      }
    }
    
    // Verificar logros de flechas
    const logosFlechas = await Logro.find({
      tipo: 'puntaje',
      requisito: { $lte: user.total_flechas_lanzadas }
    });
    
    for (const logro of logosFlechas) {
      const logroYaObtenido = await LogroUsuario.findOne({
        usuario: userId,
        logro: logro._id
      });
      
      if (!logroYaObtenido) {
        // Otorgar logro
        const nuevoLogroUsuario = new LogroUsuario({
          usuario: userId,
          logro: logro._id
        });
        
        await nuevoLogroUsuario.save();
        logrosDesbloqueados.push(logro);
        
        // Dar experiencia
        user.experiencia += logro.puntos_exp;
        await registrarLogroDesbloqueado(user, logro);
      }
    }
    
    // Verificar logros de consistencia (promedio)
    if (entrenamiento.tiradas.length > 0) {
      const totalPuntos = entrenamiento.tiradas.reduce((sum, tirada) => sum + tirada.total, 0);
      const totalFlechas = entrenamiento.tiradas.reduce((sum, tirada) => sum + tirada.puntos.length, 0);
      const promedio = totalPuntos / totalFlechas;
      
      // NUEVO: Logros de puntaje total
      const logrosTotal = await Logro.find({
        tipo: 'puntaje',
        descripcion: { $regex: 'total de', $options: 'i' },
        requisito: { $lte: totalPuntos }
      });
      
      for (const logro of logrosTotal) {
        const logroYaObtenido = await LogroUsuario.findOne({
          usuario: userId,
          logro: logro._id
        });
        
        if (!logroYaObtenido) {
          // Otorgar logro
          const nuevoLogroUsuario = new LogroUsuario({
            usuario: userId,
            logro: logro._id
          });
          
          await nuevoLogroUsuario.save();
          logrosDesbloqueados.push(logro);
          
          // Dar experiencia
          user.experiencia += logro.puntos_exp;
          await registrarLogroDesbloqueado(user, logro);
        }
      }
      
      // Verificar logros de promedio
      const logrosConsistencia = await Logro.find({
        tipo: 'consistencia',
        descripcion: { $regex: 'promedio de', $options: 'i' },
        requisito: { $lte: promedio }
      });
      
      for (const logro of logrosConsistencia) {
        const logroYaObtenido = await LogroUsuario.findOne({
          usuario: userId,
          logro: logro._id
        });
        
        if (!logroYaObtenido) {
          // Otorgar logro
          const nuevoLogroUsuario = new LogroUsuario({
            usuario: userId,
            logro: logro._id
          });
          
          await nuevoLogroUsuario.save();
          logrosDesbloqueados.push(logro);
          
          // Dar experiencia
          user.experiencia += logro.puntos_exp;
          await registrarLogroDesbloqueado(user, logro);
        }
      }
      
      // NUEVO: Verificar logros de dieces por entrenamiento
      const totalDieces = entrenamiento.tiradas.reduce((sum, tirada) => {
        return sum + tirada.puntos.filter(p => p === 10).length;
      }, 0);
      
      const logrosDieces = await Logro.find({
        tipo: 'consistencia',
        $or: [
          { descripcion: { $regex: 'dieces en un mismo', $options: 'i' } },
          { descripcion: { $regex: 'tirador selecto', $options: 'i' } },
          { descripcion: { $regex: 'francotirador', $options: 'i' } }
        ],
        requisito: { $lte: totalDieces }
      });
      
      for (const logro of logrosDieces) {
        const logroYaObtenido = await LogroUsuario.findOne({
          usuario: userId,
          logro: logro._id
        });
        
        if (!logroYaObtenido) {
          // Otorgar logro
          const nuevoLogroUsuario = new LogroUsuario({
            usuario: userId,
            logro: logro._id
          });
          
          await nuevoLogroUsuario.save();
          logrosDesbloqueados.push(logro);
          
          // Dar experiencia
          user.experiencia += logro.puntos_exp;
          await registrarLogroDesbloqueado(user, logro);
        }
      }
      
      // NUEVO: Verificar logros de rondas perfectas
      let rondaPerfecta = false;
      let tresConsecutivos = false;
      let rondaDieces = false;
      
      // Verificar cada tirada
      for (const tirada of entrenamiento.tiradas) {
        // Ronda perfecta (todas 8+)
        if (tirada.puntos.length > 0 && tirada.puntos.every(p => p >= 8)) {
          rondaPerfecta = true;
        }
        
        // Ronda de solo dieces
        if (tirada.puntos.length > 0 && tirada.puntos.every(p => p === 10)) {
          rondaDieces = true;
        }
        
        // Tres dieces consecutivos
        for (let i = 0; i <= tirada.puntos.length - 3; i++) {
          if (tirada.puntos[i] === 10 && tirada.puntos[i+1] === 10 && tirada.puntos[i+2] === 10) {
            tresConsecutivos = true;
            break;
          }
        }
      }
      
      // Otorgar logros de rondas
      if (rondaPerfecta) {
        const logro = await Logro.findOne({
          tipo: 'consistencia',
          descripcion: { $regex: 'todas las flechas 8\\+', $options: 'i' }
        });
        
        if (logro) {
          const logroYaObtenido = await LogroUsuario.findOne({
            usuario: userId,
            logro: logro._id
          });
          
          if (!logroYaObtenido) {
            const nuevoLogroUsuario = new LogroUsuario({
              usuario: userId,
              logro: logro._id
            });
            
            await nuevoLogroUsuario.save();
            logrosDesbloqueados.push(logro);
            user.experiencia += logro.puntos_exp;
            await registrarLogroDesbloqueado(user, logro);
          }
        }
      }
      
      if (tresConsecutivos) {
        const logro = await Logro.findOne({
          tipo: 'consistencia',
          descripcion: { $regex: 'dieces consecutivos', $options: 'i' }
        });
        
        if (logro) {
          const logroYaObtenido = await LogroUsuario.findOne({
            usuario: userId,
            logro: logro._id
          });
          
          if (!logroYaObtenido) {
            const nuevoLogroUsuario = new LogroUsuario({
              usuario: userId,
              logro: logro._id
            });
            
            await nuevoLogroUsuario.save();
            logrosDesbloqueados.push(logro);
            user.experiencia += logro.puntos_exp;
            await registrarLogroDesbloqueado(user, logro);
          }
        }
      }
      
      if (rondaDieces) {
        const logro = await Logro.findOne({
          tipo: 'consistencia',
          descripcion: { $regex: 'solo dieces', $options: 'i' }
        });
        
        if (logro) {
          const logroYaObtenido = await LogroUsuario.findOne({
            usuario: userId,
            logro: logro._id
          });
          
          if (!logroYaObtenido) {
            const nuevoLogroUsuario = new LogroUsuario({
              usuario: userId,
              logro: logro._id
            });
            
            await nuevoLogroUsuario.save();
            logrosDesbloqueados.push(logro);
            user.experiencia += logro.puntos_exp;
            await registrarLogroDesbloqueado(user, logro);
          }
        }
      }
    }
    
    // NUEVO: Verificar logros de distancia
    const distancia = entrenamiento.distancia;
    const entrenamientosPorDistancia = {};
    
    // Buscar todos los entrenamientos del usuario
    const Entrenamiento = mongoose.model('Entrenamiento');
    const entrenamientosUsuario = await Entrenamiento.find({
      usuario: userId,
      estado: 'finalizado'
    });
    
    // Contar entrenamientos por distancia
    entrenamientosUsuario.forEach(ent => {
      const dist = ent.distancia;
      entrenamientosPorDistancia[dist] = (entrenamientosPorDistancia[dist] || 0) + 1;
    });
    
    // Comprobar logros de distancia
    const logrosDistancia = await Logro.find({
      tipo: 'experiencia',
      $or: [
        { descripcion: { $regex: '10 metros', $options: 'i' } },
        { descripcion: { $regex: '18 metros', $options: 'i' } },
        { descripcion: { $regex: '30 metros', $options: 'i' } }
      ]
    });
    
    for (const logro of logrosDistancia) {
      const logroYaObtenido = await LogroUsuario.findOne({
        usuario: userId,
        logro: logro._id
      });
      
      if (!logroYaObtenido) {
        // Determinar la distancia del logro
        let distanciaLogro = '';
        if (logro.descripcion.includes('10 metros')) distanciaLogro = '10m';
        if (logro.descripcion.includes('18 metros')) distanciaLogro = '18m';
        if (logro.descripcion.includes('30 metros')) distanciaLogro = '30m';
        
        // Verificar si cumple el requisito para esta distancia
        const entrenamientosDist = Object.keys(entrenamientosPorDistancia)
          .filter(d => {
            if (distanciaLogro === '10m') return d.includes('10');
            if (distanciaLogro === '18m') return d.includes('18');
            if (distanciaLogro === '30m') return parseInt(d) >= 30;
            return false;
          })
          .reduce((sum, d) => sum + entrenamientosPorDistancia[d], 0);
        
        if (entrenamientosDist >= logro.requisito) {
          // Otorgar logro
          const nuevoLogroUsuario = new LogroUsuario({
            usuario: userId,
            logro: logro._id
          });
          
          await nuevoLogroUsuario.save();
          logrosDesbloqueados.push(logro);
          
          // Dar experiencia
          user.experiencia += logro.puntos_exp;
          await registrarLogroDesbloqueado(user, logro);
        }
      }
    }
    
    // Verificar logros de constancia (días consecutivos)
    const logrosExperiencia = await Logro.find({
      tipo: 'experiencia',
      descripcion: { $regex: 'días consecutivos', $options: 'i' },
      requisito: { $lte: user.entrenamientos_consecutivos }
    });
    
    for (const logro of logrosExperiencia) {
      const logroYaObtenido = await LogroUsuario.findOne({
        usuario: userId,
        logro: logro._id
      });
      
      if (!logroYaObtenido) {
        // Otorgar logro
        const nuevoLogroUsuario = new LogroUsuario({
          usuario: userId,
          logro: logro._id
        });
        
        await nuevoLogroUsuario.save();
        logrosDesbloqueados.push(logro);
        
        // Dar experiencia
        user.experiencia += logro.puntos_exp;
        await registrarLogroDesbloqueado(user, logro);
      }
    }
  }
  
  let subiNivel = false;
  // Verificar si el usuario sube de nivel
  while (user.experiencia >= user.experiencia_necesaria) {
    const nivelAnterior = user.nivel;
    user.nivel += 1;
    user.experiencia -= user.experiencia_necesaria;
    user.experiencia_necesaria = Math.floor(user.experiencia_necesaria * 1.5);
    
    // Registrar actividad de subida de nivel
    await registrarNivelAlcanzado(user, user.nivel);
    subiNivel = true;
  }
  
  await user.save();
  
  // Ahora, registramos las actividades para cada logro desbloqueado
  for (const logro of logrosDesbloqueados) {
    await registrarLogroDesbloqueado(user, logro);
  }
  
  return {
    logrosDesbloqueados,
    subiNivel,
    nivelAnterior: nivelInicial,
    nivelActual: user.nivel
  };
};

/**
 * Obtener todos los logros del usuario
 * @param {String} userId - ID del usuario
 */
exports.obtenerLogrosUsuario = async (userId) => {
  const logrosUsuario = await LogroUsuario.find({ usuario: userId })
    .populate('logro')
    .sort({ fecha_desbloqueo: -1 });
  
  return logrosUsuario;
};

/**
 * Obtener todos los logros disponibles en el sistema
 */
exports.obtenerTodosLosLogros = async () => {
  const logros = await Logro.find().sort({ nivel: 1, tipo: 1 });
  return logros;
}; 