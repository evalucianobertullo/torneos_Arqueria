const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const session = require('express-session');
const flash = require('connect-flash');
const passport = require('passport');
const expressLayouts = require('express-ejs-layouts');
const { ensureAuthenticated } = require('./middleware/auth');

// Cargar variables de entorno
dotenv.config();

// Conectar a la base de datos
connectDB();

// Inicializar la aplicación
const app = express();

// Configurar Passport
require('./config/passport')(passport);

// Configurar EJS como motor de plantillas
app.use(expressLayouts);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));
app.set('layout', 'layout');

// Middleware para procesar datos de formularios
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Archivos estáticos
app.use(express.static(path.join(__dirname, '../public')));

// Configurar sesiones
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'secret',
    resave: false,
    saveUninitialized: false
  })
);

// Inicializar Passport
app.use(passport.initialize());
app.use(passport.session());

// Configurar Flash
app.use(flash());

// Variables globales
app.use((req, res, next) => {
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.error = req.flash('error');
  res.locals.user = req.user || null;
  next();
});

// Middleware para cargar la configuración en todas las vistas
app.use(async (req, res, next) => {
  try {
    const AppConfig = require('./models/AppConfig');
    let config = await AppConfig.findOne();
    if (!config) {
      config = new AppConfig();
      await config.save();
    }
    res.locals.appConfig = config;
    next();
  } catch (error) {
    console.error('Error al cargar configuración:', error);
    next();
  }
});

// Rutas
app.use('/', require('./routes/auth'));
app.use('/torneos', require('./routes/torneos'));
app.use('/users', require('./routes/users'));
app.use('/entrenamientos', require('./routes/entrenamientos'));
app.use('/actividades', require('./routes/actividades'));
app.use('/admin', require('./routes/admin'));

// Ruta principal
app.get('/', (req, res) => {
  res.render('index', {
    title: 'Torneos de Arquería'
  });
});

// Ruta del dashboard
app.get('/dashboard', ensureAuthenticated, async (req, res) => {
  try {
    // Obtener las últimas 6 actividades para el carrusel
    const actividadService = require('./services/actividadService');
    let resultado = await actividadService.obtenerActividadesRecientes(6, 1);
    
    console.log('Actividades obtenidas:', resultado);
    
    // Si no hay actividades, crear una de prueba
    if (!resultado.actividades || resultado.actividades.length === 0) {
      console.log('No hay actividades, creando una de prueba...');
      await actividadService.crearActividadPrueba(req.user);
      resultado = await actividadService.obtenerActividadesRecientes(6, 1);
      console.log('Nueva consulta después de crear actividad:', resultado);
    }
    
    res.render('dashboard', {
      title: 'Panel de Control',
      user: req.user,
      actividades: resultado.actividades || [],
      formatearFecha: require('./utils/helpers').formatearFecha,
      mensajeExito: req.flash('mensajeExito'),
      mensajeError: req.flash('mensajeError')
    });
  } catch (error) {
    console.error('Error al cargar el dashboard:', error);
    res.render('dashboard', {
      title: 'Panel de Control',
      user: req.user,
      actividades: [],
      formatearFecha: require('./utils/helpers').formatearFecha,
      mensajeExito: req.flash('mensajeExito'),
      mensajeError: req.flash('mensajeError')
    });
  }
});

// Puerto
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor iniciado en puerto ${PORT}`);
}); 