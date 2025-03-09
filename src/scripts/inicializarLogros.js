require('dotenv').config();
const mongoose = require('mongoose');
const { inicializarLogros } = require('../services/logroService');

// Conectar a la base de datos
mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('Conexión a MongoDB establecida');
    
    try {
      // Inicializar logros
      await inicializarLogros();
      console.log('✅ Logros inicializados correctamente');
    } catch (error) {
      console.error('❌ Error al inicializar logros:', error);
    } finally {
      // Cerrar conexión
      await mongoose.connection.close();
      console.log('Conexión a MongoDB cerrada');
      process.exit(0);
    }
  })
  .catch(err => {
    console.error('Error al conectar a MongoDB:', err);
    process.exit(1);
  }); 