//cargamos el módulo mysql
const mysql = require('mysql');

//creamos la conexión a la BBDD y le asignamos las variables de entorno
const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE
})

//método que realiza la conexión a la BBDD
connection.connect((error)=> {
    if(error){
        console.log('Ha habido un error en la conexión. Su código es:'+ error);
        return;
    }
    console.log('Conexión realizada a la base de datos');
});

//exportamos el módulo conecction
module.exports = connection;