//1 - cargamos express
const express = require('express');
const bodyParser = require('body-parser');
const app = express();

//2 - capturar datos de formulario utilizando un formato json
app.use(express.urlencoded({extended:false}));
app.use(express.json());

//3 - cargamos dotenv y le asignamos el archivo para las variables de entorno
const dotenv = require('dotenv');
dotenv.config({path: './env/.env'});

//4 - cargamos el directorio public, cada vez que llamemos a resources estaremos cargando el directorio public
//al utilizar el __dirname podemos mover el proyecto de carpeta y sin tener que actualizar las rutas
app.use('/resources', express.static('public'));
app.use('/resources', express.static(__dirname+'/public'));

//5 - establecer el motor de plantillas
app.set('view engine', 'ejs');

//6 - cargamos bcriptjs. Ya no se utiliza aquí sino en el archivo de rutas.js
//const bcriptjs = require('bcryptjs')

//7 - variables de sesión. Cargamos la sesion y establecemos la clave
const session = require('express-session');
app.use(session({
    secret: 'secret',
    resave: true,
    saveUninitialized: true
}))

//8 - cargamos al módulo de conexion
const connection = require('./database/db');

// Cargamos las rutas del archivo rutas.js y las definimos para su uso. Rutas definidas de la 10 a la 13.
const rutas = require('./src/rutas');
app.use('/', rutas);

//14 - función para limpiar la caché luego del logout
app.use(function(req, res, next) {
    if (!req.user)
        res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    next();
});


//creamos el servidor
app.listen (3000, (req,res)=>{
    console.log('Conexión establecida con el servidor http://localhost:3000/');
})



