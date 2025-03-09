const { inicializarLogros } = require('../services/logroService');

/**
 * Inicializar componentes de la aplicación
 * Debe ser llamado después de que la conexión a la base de datos esté establecida
 */
exports.initializeApp = async () => {
  try {
    // Inicializar logros
    await inicializarLogros();
    console.log('✅ Logros inicializados correctamente');
    
    // Puedes agregar más inicializaciones aquí
    
    return true;
  } catch (error) {
    console.error('❌ Error al inicializar la aplicación:', error);
    return false;
  }
}; 