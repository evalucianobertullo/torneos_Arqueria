/**
 * Funciones de utilidad para la aplicación
 */

/**
 * Formatea una fecha en formato legible en español
 * @param {Date} fecha - La fecha a formatear
 * @returns {string} - La fecha formateada
 */
exports.formatearFecha = (fecha) => {
  if (!fecha) return 'Fecha no disponible';
  
  const opciones = { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };
  
  return new Date(fecha).toLocaleDateString('es-ES', opciones);
}; 