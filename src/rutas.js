// Cargamos las librerías: express, bcryptjs; y el módulo de conexión a la BBDD creado por nosotros que se utilizan en las rutas:
const express = require('express');
const rutas = express.Router();
const bcryptjs = require('bcryptjs');
const connectionbd = require('../database/db');

// 10 - registro. Código que se cargará una vez relleno el formulario de registro
rutas.post('/register', async (req, res) => {
    const { nombre, apellido, email, telefono, rol_id, password } = req.body;

    // Validamos que todos los campos requeridos estén presentes
    if (!nombre || !apellido || !email || !telefono || !rol_id || !password) {
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

    // Mapeamos el rol recibido a su ID correspondiente
    const rolId = rol_id === 'admin' ? 1 : (rol_id !== 'admin' ? 2 : null);

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
        // Encriptamos la contraseña
        const passwordHash = await bcryptjs.hash(password, 8);

        // Insertamos los datos en nuestra BBDD
        connectionbd.query('INSERT INTO usuarios SET ?', {
            nombre,
            apellido,
            email,
            telefono,
            rol_id: rolId,
            password: passwordHash
        }, (error) => {
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
                // Registro exitoso
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

// 11 - Método para la autenticación
rutas.post('/auth', async (req, res) => {
    const { email, pass } = req.body;

    if (email && pass) {
        connectionbd.query('SELECT * FROM usuarios WHERE email = ?', [email], async (error, results) => {
            if (results.length === 0 || !(await bcryptjs.compare(pass, results[0].password))) {
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

// 12 - Renderización para la ruta principal /
rutas.get('/', (req, res) => {
    res.render('index', {
        login: req.session.loggedin,
        name: req.session.loggedin ? req.session.name : ''
    });
});

// 12B - Renderización para la ruta /login
rutas.get('/login', (req, res) => {
    res.render('login', {
        login: req.session.loggedin
    });
});

// 12C - Renderización para la ruta /registro
rutas.get('/registro', (req, res) => {
    res.render('register', {
        login: req.session.loggedin
    });
});

// 12D - Renderización para la ruta /admin
rutas.get('/admin', (req, res) => {
    connectionbd.query('SELECT * FROM usuarios', (error, results) => {
        if (error) throw error;
        res.render('admin', {
            login: req.session.loggedin,
            name: req.session.name,
            rol: req.session.rol,
            results: results
        });
    });
});

// 13 - Ruta para renderizar y gestionar usuarios CRUD
rutas.get('/usuarios', (req, res) => {
    if (req.session.loggedin) {
        connectionbd.query('SELECT * FROM usuarios', (error, results) => {
            if (error) return res.status(500).send("Error al obtener usuarios.");
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

// Crear nuevo usuario
rutas.post('/usuarios', async (req, res) => {
    const { nombre, apellido, email, telefono, rol_id, password } = req.body;

    if (!nombre || !apellido || !email || !telefono || !rol_id || !password) {
        return res.status(400).send("Todos los campos son obligatorios.");
    }

    try {
        const passwordHash = await bcryptjs.hash(password, 8);
        connectionbd.query('INSERT INTO usuarios SET ?', {
            nombre, apellido, email, telefono, rol_id, password: passwordHash
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

// Editar usuario
rutas.get('/usuarios/edit/:id', (req, res) => {
    const id = req.params.id;
    connectionbd.query('SELECT * FROM usuarios WHERE id = ?', [id], (error, results) => {
        if (error || results.length === 0) 
            return res.status(404).send("Usuario no encontrado.");

        res.render('edit', {
            usuario: results[0],
            login: req.session.loggedin,
            name: req.session.name
        });
    });
});

// Actualizar usuario
rutas.post('/usuarios/edit/:id', async (req, res) => {
    const id = req.params.id;
    const { nombre, apellido, email, telefono, rol_id, password } = req.body;

    let updateData = { nombre, apellido, email, telefono, rol_id, };

    // Encriptar nueva contraseña si se proporciona
    if (password) {
        updateData.password = await bcryptjs.hash(password, 8);
    }

    connectionbd.query('UPDATE usuarios SET ? WHERE id = ?', [updateData, id], (error) => {
        if (error) return res.status(500).send("Error al actualizar el usuario.");
        res.redirect('/usuarios'); // Redirigir a la vista de usuarios
    });
});

// Eliminar usuario
rutas.get('/usuarios/delete/:id', (req, res) => {
    const id = req.params.id;
    connectionbd.query('DELETE FROM usuarios WHERE id = ?', [id], (error) => {
        if (error) return res.status(500).send("Error al eliminar el usuario.");
        res.redirect('/usuarios'); // Redirigir a la vista de usuarios
    });
});

// 14 - Ruta para destruir la sesión y redirigir a la página principal
rutas.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/');
    });
});

// **************** Ruta para renderizar y gestionar profesionales CRUD ****************
rutas.get('/profesionales', (req, res) => {
    if (req.session.loggedin) {
        connectionbd.query('SELECT * FROM profesionales', (error, results) => {
            if (error) return res.status(500).send("Error al obtener profesional.");
            res.render('profesionales', {
                login: true,
                name: req.session.name,
                rol: req.session.rol,
                results: results // Pasamos la lista de profesionales a la vista
            });
        });
    } else {
        res.render('profesionales', {
            login: false,
            name: "Área privada, inicie sesión para poder acceder al contenido."
        });
    }
});

// Ruta para manejar la creación de un nuevo profesional
rutas.post('/profesionales', async (req, res) => {
    const { nombre, apellido, telefono, email, categoria } = req.body;

    if (!nombre || !apellido || !telefono || !email || !categoria) {
        return res.status(400).send("Todos los campos son obligatorios.");
    }

    try {
        connectionbd.query('INSERT INTO profesionales SET ?', {
            nombre, apellido, telefono, email, categoria
        }, (error) => {
            if (error) {
                console.log(error);
                return res.status(500).send("Error al registrar el profesional.");
            }
            res.redirect('/profesionales'); // Redirigir a la vista de profesionales
        });
    } catch (error) {
        console.log(error);
        res.status(500).send("Ocurrió un error en el servidor.");
    }
});

// Ruta para editar profesional (cargar el profesional a editar)
rutas.get('/profesionales/edit/:id', (req, res) => {
    const id = req.params.id;
    connectionbd.query('SELECT * FROM profesionales WHERE id = ?', [id], (error, results) => {
        if (error || results.length === 0) {
            return res.status(404).send("profesional no encontrado.");
        }
        res.render('edit2', { profesional: results[0], login: req.session.loggedin });
    });
});

// Ruta para actualizar profesionales
rutas.post('/profesionales/edit/:id', (req, res) => {
    const id = req.params.id;
    const { nombre, apellido, telefono, email, categoria } = req.body;

    // Actualizar en la base de datos
    connectionbd.query('UPDATE profesionales SET ? WHERE id = ?', [
        { nombre, apellido, telefono, email, categoria },
        id
    ], (error) => {
        if (error) {
            console.error("Error al actualizar el profesional:", error);
            return res.status(500).send("Error al actualizar el profesional.");
        }
        res.redirect('/profesionales'); // Redirigir a la vista de profesionales
    });
});

// Eliminar profesional
rutas.get('/profesionales/delete/:id', (req, res) => {
    const id = req.params.id;
    connectionbd.query('DELETE FROM profesionales WHERE id = ?', [id], (error) => {
        if (error) return res.status(500).send("Error al eliminar el profesional.");
        res.redirect('/profesionales'); // Redirigir a la vista de profesionales
    });
});

// 14 - Ruta para destruir la sesión y redirigir a la página principal
rutas.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/');
    });
});

// Exportamos todas las rutas
module.exports = rutas;
