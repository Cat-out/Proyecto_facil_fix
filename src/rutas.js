// Cargamos las librerías: express, bcryptjs; y el módulo de conexión a la BBDD creado por nosotros que se utilizan en las rutas:
const express = require('express');
const rutas = express.Router();
const bcryptjs = require('bcryptjs');
const connectionbd = require('../database/db');


// 10 - registro. Código que se cargará una vez relleno el formulario de registro
rutas.post('/register', async (req, res) => {
    // Variables para guardar la información de los campos
    const name = req.body.nombre;
    const lastName = req.body.apellido;
    const email = req.body.email;
    const phone = req.body.telefono;
    const rol = req.body.rol_id;
    const pass = req.body.password;

    // Validamos que todos los campos requeridos estén presentes
    if (!name || !lastName || !email || !phone || !rol || !pass) {
        return res.render('register', {
            alert: true,
            alertTitle: "Error",
            alertMessage: "Todos los campos son obligatorios",
            alertIcon: 'error',
            showConfirmButton: true,
            timer: false,
            ruta: 'registro',
            login: false
        });
    }

    // Mapeamos el rol recibido a su ID correspondiente (por ejemplo, 1 para 'admin')
    const rolId = rol === 'admin' ? 1 : (rol != 'admin' ? 2 : null);

    if (!rolId) {
        return res.render('register', {
            alert: true,
            alertTitle: "Error",
            alertMessage: "Rol no válido",
            alertIcon: 'error',
            showConfirmButton: true,
            timer: false,
            ruta: 'registro',
            login: false
        });
    }

    try {
        // Variable que guarda la contraseña encriptada en 8 iteraciones por el módulo bcrypt
        let passwordHash = await bcryptjs.hash(pass, 8);

        // Insertamos los datos en nuestra BBDD
        connectionbd.query('INSERT INTO usuarios SET ?', {
            nombre: name,
            apellido: lastName, // Asegúrate de que coincida con la columna en la base de datos
            email: email,
            telefono: phone,
            rol_id: rolId,  // Aquí usamos el ID del rol en lugar de la cadena 'admin'
            password: passwordHash
        }, async (error, results) => {
            if (error) {
                console.log(error);
                return res.render('register', {
                    alert: true,
                    alertTitle: "Error",
                    alertMessage: "Error al registrar usuario",
                    alertIcon: 'error',
                    showConfirmButton: true,
                    timer: false,
                    ruta: 'registro',
                    login: false
                });
            } else {
                // Enviamos el render con un objeto para el Sweet Alert 2
                res.render('register', {
                    alert: true,
                    alertTitle: "Registro",
                    alertMessage: "¡Registro exitoso!",
                    alertIcon: 'success',
                    showConfirmButton: false,
                    timer: 1500,
                    ruta: '',
                    login: false
                });
            }
        });
    } catch (error) {
        console.log(error);
        res.render('register', {
            alert: true,
            alertTitle: "Error",
            alertMessage: "Ocurrió un error en el servidor",
            alertIcon: 'error',
            showConfirmButton: true,
            timer: false,
            ruta: 'registro',
            login: false
        });
    }
});


// 11 - Método para la autenticación para el post definido como /auth. Método que se utiliza en el formulario para iniciar sesión
rutas.post('/auth', async (req, res) => {
    const email = req.body.email;
    const pass = req.body.pass;

    // Comprobamos si existe el usuario y la contraseña
    if (email && pass) {
        // Comprobamos si existe el usuario en la base de datos
        connectionbd.query('SELECT * FROM usuarios WHERE email = ?', [email], async (error, results, fields) => {
            // Comprobamos si hemos obtenido resultados y si ha coincidido la contraseña en tal caso
            if (results.length == 0 || !(await bcryptjs.compare(pass, results[0].password))) {
                res.render('login', {
                    alert: true,
                    alertTitle: "Error",
                    alertMessage: "Usuario y/o contraseña erróneo",
                    alertIcon: 'error',
                    showConfirmButton: true,
                    timer: false,
                    ruta: 'login',
                    login: false
                });
            } else {
                // Creamos una variable de sesión y le asignamos true
                req.session.loggedin = true;
                req.session.name = results[0].nombre;
                req.session.rol = results[0].rol_id;

                res.render('login', {
                    alert: true,
                    alertTitle: "Conexión exitosa",
                    alertMessage: "¡Inicio de sesión exitoso!",
                    alertIcon: 'success',
                    showConfirmButton: false,
                    timer: 1500,
                    ruta: 'admin',
                    login: false
                });
            }
        });
    } else {
        res.render('login', {
            alert: true,
            alertTitle: "Advertencia",
            alertMessage: "Ingrese el usuario y la contraseña",
            alertIcon: 'warning',
            showConfirmButton: true,
            timer: false,
            ruta: 'login',
            login: false,
        });
    }
});

// 12 - Renderización para la ruta principal / de la vista index.ejs
rutas.get('/', (req, res) => {
    // Si existe la variable que guarda la autenticación
    if (req.session.loggedin) {
        // Renderizamos index, asignándole el nombre de usuario y la variable login con valor true
        res.render('index', {
            login: true,
            name: req.session.name
        });
    } else {
        // Renderizamos index, asignándole el texto a name y la variable login con valor false
        res.render('index', {
            login: false,
            name: 'Debe iniciar sesión'
        });
    }
    res.end();
});

// 12B - Renderización para la ruta /login de la vista login.ejs
rutas.get('/login', (req, res) => {
    // Si existe la variable que guarda la autenticación
    if (req.session.loggedin) {
        // Renderizamos login, asignándole el nombre de usuario y la variable login con valor true
        res.render('login', {
            login: true
        });
    } else {
        // Renderizamos login, asignándole el texto a name y la variable login con valor false
        res.render('login', {
            login: false
        });
    }
    res.end();
});

// 12C - Renderización para la ruta /registro de la vista register.ejs
rutas.get('/registro', (req, res) => {
    // Si existe la variable que guarda la autenticación
    if (req.session.loggedin) {
        // Renderizamos register, asignándole el nombre de usuario y la variable login con valor true
        res.render('register', {
            login: true
        });
    } else {
        // Renderizamos register, asignándole el texto a name y la variable login con valor false
        res.render('register', {
            login: false
        });
    }
    res.end();
});

// 12D - Renderización para la ruta /admin de la vista admin.ejs
rutas.get('/admin', (req, res) => {
    connectionbd.query('SELECT * FROM usuarios', (error, results) => {
        if (error) {
            throw error;
        } else {
            if (req.session.loggedin) {
                res.render('admin', {
                    login: true,
                    name: req.session.name,
                    rol: req.session.rol,
                    results: results
                });
            } else {
                res.render('admin', {
                    login: false,
                    name: "Área privada, inicie sesión para poder acceder al contenido",
                    rol: '',
                    results: results
                });
            }
        }
    });
});

//13 Ruta para renderizar y gestionar usuarios CRUD ******************************************************************************************
rutas.get('/usuarios', (req, res) => {
    if (req.session.loggedin) {
        connectionbd.query('SELECT * FROM usuarios', (error, results) => {
            if (error) {
                return res.status(500).send("Error al obtener usuarios.");
            }
            res.render('usuarios', {
                login: true,
                name: req.session.name,
                rol: req.session.rol,
                results: results // Pasamos la lista de usuarios a la vista
            });
        });
    } else {
        res.render('usuarios', {
            login: false,
            name: "Área privada, inicie sesión para poder acceder al contenido."
        });
    }
});

// Ruta para manejar la creación de un nuevo usuario
rutas.post('/usuarios', async (req, res) => {
    const { nombre, apellido, email, telefono, rol_id, password } = req.body;

    if (!nombre || !apellido || !email || !telefono || !rol_id || !password) {
        return res.status(400).send("Todos los campos son obligatorios.");
    }

    try {
        let passwordHash = await bcryptjs.hash(password, 8);

        connectionbd.query('INSERT INTO usuarios SET ?', {
            nombre,
            apellido,
            email,
            telefono,
            rol_id,
            password: passwordHash
        }, (error) => {
            if (error) {
                console.log(error);
                return res.status(500).send("Error al registrar el usuario.");
            }
            res.redirect('/usuarios'); // Redirigir a la vista de usuarios
        });
    } catch (error) {
        console.log(error);
        res.status(500).send("Ocurrió un error en el servidor.");
    }
});

// Ruta para editar usuario (cargar el usuario a editar)
rutas.get('/usuarios/edit/:id', (req, res) => {
    const id = req.params.id;
    connectionbd.query('SELECT * FROM usuarios WHERE id = ?', [id], (error, results) => {
        if (error || results.length === 0) return res.status(404).send("Usuario no encontrado.");

        res.render('edit', {
            usuario: results[0],
            login: req.session.loggedin,
            name: req.session.name
        });
    });
});

// Ruta para actualizar usuario
rutas.post('/usuarios/edit/:id', async (req, res) => {
    const id = req.params.id;
    const { nombre, apellido, email, telefono, rol_id, password } = req.body;

    // Encriptar nueva contraseña si se proporciona
    let passwordHash;
    if (password) {
        passwordHash = await bcryptjs.hash(password, 8);
    }

    // Actualizar en la base de datos
    connectionbd.query('UPDATE usuarios SET ? WHERE id = ?', [
        {
            nombre,
            apellido,
            email,
            telefono,
            rol_id,
            ...(password ? { password: passwordHash } : {})
        }, id
    ], (error) => {
        if (error) return res.status(500).send("Error al actualizar el usuario.");
        res.redirect('/usuarios'); // Redirigir a la vista de usuarios
    });
});

// Ruta para eliminar usuario
rutas.get('/usuarios/delete/:id', (req, res) => {
    const id = req.params.id;
    connectionbd.query('DELETE FROM usuarios WHERE id = ?', [id], (error) => {
        if (error) return res.status(500).send("Error al eliminar el usuario.");
        res.redirect('/usuarios'); // Redirigir a la vista de usuarios
    });
});

// 14 - Ruta que será cargada para destruir la sesión y redirigir a la página principal
rutas.get('/logout', function (req, res) {
    // Destruye la sesión.
    req.session.destroy(() => {
        res.redirect('/') // Siempre se ejecutará después de que se destruya la sesión
    });
});



// Exportamos todas las rutas
module.exports = rutas;
