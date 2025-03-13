// Almacenamiento temporal de amistosos en memoria
const amistososActivos = new Map();

// Limpiar amistosos finalizados
const limpiarAmistososFinalizados = () => {
  for (const [id, amistoso] of amistososActivos) {
    if (amistoso.estado === 'finalizado') {
      amistososActivos.delete(id);
    }
  }
};

// Obtener lista de amistosos activos
exports.getAmistosos = async (req, res) => {
  try {
    res.render('admin/amistosos/index', {
      amistosos: Array.from(amistososActivos.values()),
      mensajeExito: req.flash('mensajeExito'),
      mensajeError: req.flash('mensajeError')
    });
  } catch (error) {
    console.error('Error al obtener amistosos:', error);
    req.flash('mensajeError', 'Error al cargar los amistosos');
    res.redirect('/dashboard');
  }
};

// Mostrar formulario para nuevo amistoso
exports.getNuevoAmistoso = async (req, res) => {
  try {
    res.render('admin/amistosos/nuevo', {
      mensajeExito: req.flash('mensajeExito'),
      mensajeError: req.flash('mensajeError')
    });
  } catch (error) {
    console.error('Error al cargar formulario de nuevo amistoso:', error);
    req.flash('mensajeError', 'Error al cargar el formulario');
    res.redirect('/admin/amistosos');
  }
};

// Crear nuevo amistoso
exports.crearAmistoso = async (req, res) => {
  try {
    console.log('Datos recibidos:', req.body);

    // Limpiar amistosos finalizados antes de crear uno nuevo
    limpiarAmistososFinalizados();

    // Obtener el array de participantes del body
    const participantes = req.body['participantes[]'] || req.body.participantes;
    
    // Validar que tengamos un array de participantes
    if (!participantes || (typeof participantes === 'string' ? [participantes] : participantes).length < 2) {
      throw new Error('Se requieren al menos 2 participantes');
    }

    // Convertir a array si es un string (caso de un solo participante)
    const participantesArray = typeof participantes === 'string' ? [participantes] : participantes;

    // Validar nombres únicos
    const nombresUnicos = new Set(participantesArray);
    if (nombresUnicos.size !== participantesArray.length) {
      throw new Error('Los nombres de los participantes deben ser únicos');
    }

    // Validar número máximo de participantes (opcional)
    if (participantesArray.length > 10) {
      throw new Error('El máximo es de 10 participantes por amistoso');
    }

    const amistoso = {
      id: Date.now().toString(),
      fecha: new Date(),
      estado: 'activo',
      participantes: participantesArray.map(nombre => ({
        nombre: nombre.trim(),
        puntajes: Array(6).fill(null), // 2 flechas x 3 rondas = 6 flechas
        total: 0,
        rondaCompletada: false // Nuevo campo para seguimiento
      })),
      rondaActual: 1,
      flechaActual: 1
    };

    amistososActivos.set(amistoso.id, amistoso);
    console.log('Amistoso creado:', amistoso);

    req.flash('mensajeExito', 'Amistoso creado correctamente');
    res.redirect('/admin/amistosos');
  } catch (error) {
    console.error('Error al crear amistoso:', error);
    req.flash('mensajeError', error.message || 'Error al crear el amistoso');
    res.redirect('/admin/amistosos/nuevo');
  }
};

// Registrar puntaje
exports.registrarPuntaje = async (req, res) => {
  try {
    const { id } = req.params;
    const { participanteIndex, puntajes } = req.body;
    
    const amistoso = amistososActivos.get(id);
    if (!amistoso) {
      throw new Error('Amistoso no encontrado');
    }

    // Validar que puntajes sea un array
    if (!Array.isArray(puntajes) || puntajes.length !== 2) {
      throw new Error('Se requieren exactamente 2 puntajes');
    }

    // Validar cada puntaje
    const puntajesNum = puntajes.map(p => parseInt(p));
    if (puntajesNum.some(p => isNaN(p) || p < 0 || p > 10)) {
      throw new Error('Puntajes inválidos. Deben ser números entre 0 y 10');
    }

    const participante = amistoso.participantes[participanteIndex];
    if (!participante) {
      throw new Error('Participante no encontrado');
    }

    // Calcular índice base en el array de puntajes
    const indiceBase = (amistoso.rondaActual - 1) * 2;
    
    // Registrar los dos puntajes
    puntajesNum.forEach((puntaje, i) => {
      participante.puntajes[indiceBase + i] = puntaje;
    });
    
    // Actualizar total
    participante.total = participante.puntajes.reduce((sum, p) => sum + (p || 0), 0);

    // Marcar que este participante completó la ronda actual
    participante.rondaCompletada = true;

    // Verificar si todos los participantes han registrado sus puntajes en la ronda actual
    const todosRegistradosEnRonda = amistoso.participantes.every(p => {
      const puntajesRondaActual = [
        p.puntajes[indiceBase],
        p.puntajes[indiceBase + 1]
      ];
      return puntajesRondaActual.every(p => p !== null);
    });

    // Solo avanzar a la siguiente ronda si todos registraron sus puntajes
    if (todosRegistradosEnRonda && amistoso.rondaActual < 3) {
      amistoso.rondaActual++;
      // Resetear el estado de rondaCompletada para todos los participantes
      amistoso.participantes.forEach(p => p.rondaCompletada = false);
    }

    res.json({
      success: true,
      amistoso
    });
  } catch (error) {
    console.error('Error al registrar puntajes:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// Finalizar amistoso
exports.finalizarAmistoso = async (req, res) => {
  try {
    const { id } = req.params;
    
    const amistoso = amistososActivos.get(id);
    if (!amistoso) {
      throw new Error('Amistoso no encontrado');
    }

    // Verificar que todos los puntajes estén registrados
    const todosRegistrados = amistoso.participantes.every(p => 
      p.puntajes.every(puntaje => puntaje !== null)
    );

    if (!todosRegistrados) {
      throw new Error('Faltan puntajes por registrar');
    }

    // Calcular ganador
    amistoso.estado = 'finalizado';
    amistoso.ganador = [...amistoso.participantes]
      .sort((a, b) => b.total - a.total)[0];

    res.json({
      success: true,
      amistoso
    });

  } catch (error) {
    console.error('Error al finalizar amistoso:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// Eliminar amistoso directamente
exports.eliminarAmistoso = async (req, res) => {
  try {
    const { id } = req.params;
    
    const amistoso = amistososActivos.get(id);
    if (!amistoso) {
      throw new Error('Amistoso no encontrado');
    }

    // Eliminar el amistoso directamente
    amistososActivos.delete(id);

    res.json({
      success: true,
      mensaje: 'Amistoso eliminado correctamente'
    });

  } catch (error) {
    console.error('Error al eliminar amistoso:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
}; 