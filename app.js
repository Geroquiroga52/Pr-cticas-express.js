require('dotenv').config();
const { validarId, validarMail, validarNombre } = require('./validate')
const { deepStrictEqual } = require('assert');
const express = require('express');
const app = express();
const LoggerMiddleware = require('./middleware/loggers.js');
const errorHandler = require('./middleware/errorHandler.js');

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const authenticateToken = require('./middleware/auth.js');

// ✅ v7
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter }) 

app.use(errorHandler)
app.use(LoggerMiddleware);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const fs = require("fs");
const path = require("path");
const usersFilePath = path.join(__dirname, 'users.json');

const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.send(`
        <h1>Curso Express.js</h1>
        <p>Esto es una app node.js con express.js</p>
        <p>Corre en el puerto ${PORT}</p>
        `);
});

app.get('/users/:id', (req, res) => {
    const userId = req.params.id;
    res.send(`<h1>ID del usuario: ${userId}</h1>`)
});

app.get('/search', (req, res) => {
    const terms = req.query.termino || 'No especificado';
    const category = req.query.categoria || 'Todas';

    res.send(`
        <h2>Resultado de busqueda:</h2>
        <p>Termino: ${terms}</p>
        <p>Categoría: ${category}</p>
        `)
});

app.post('/form', (req, res) => {
    const name = req.body.nombre || 'Anónimo';
    const email = req.body.email || 'No proporcionado';
    res.json({
        message: 'Datos recibidos',
        data: {
            name,
            email
        }
    });
});

app.post('/api/data', (req, res) => {
    const data = req.body;

    if (!data || Object.keys(data).length === 0) {
        return res.status(400).json( {error: 'No se recibieron datos'} );
    }

    res.status(201).json({
        message: 'Datos JSON recibidos',
        data
    });
});

app.get('/users', (req, res) => {
    fs.readFile(usersFilePath, 'utf-8', (err, data) => {
        if (err) {
            return res.status(500).json({ error: 'Error con la conexión de datos'});
        }
        const users = JSON.parse(data);
        res.json(users);
    })
});

app.post('/users', (req, res) => {
    const newUser = req.body;
    const emailRegex = /^[^@\s]+@[^@\s]+\.[^@\s\-0-9]+$/;

    fs.readFile(usersFilePath, 'utf-8', (err, data) => {
        if (err) {
            return res.status(500).json({ error: 'Error con conexión de datos' });
        }
        const users = JSON.parse(data);

        if (!validarId(users, newUser)) {
            return res.status(409).json({ error: 'ID ya existente' });
        }
        if (!validarNombre(newUser)) {
            return res.status(400).json({ error: 'El nombre debe tener al menos 3 caracteres' });
        }
        if (!validarMail(emailRegex, newUser)) {
            return res.status(400).json({ error: 'El formato del mail no es correcto' });
        }

        users.push(newUser);
        fs.writeFile(usersFilePath, JSON.stringify(users, null, 2), (err) => {
            if (err) {
                return res.status(500).json({ error: 'Error al guardar el usuario' });
            }
            res.status(201).json(newUser);
        });
    });
});

app.put('/users/:id', (req, res) => {
    const userId = parseInt(req.params.id, 10);
    const updateUser = req.body;
    const emailRegex = /^[^@\s]+@[^@\s]+\.[^@\s\-0-9]+$/;

    fs.readFile(usersFilePath, 'utf-8', (err, data) => {
        if (err) {
            return res.status(500).json({ error: 'Error con conexión de datos' });
        }
        let users = JSON.parse(data);
        const otherUsers = users.filter(user => user.id !== userId);

        if (!validarId(otherUsers, updateUser)) {
            return res.status(409).json({ error: 'ID ya existente' });
        }
        if (!validarNombre(updateUser) && updateUser.name !== undefined) {
            return res.status(400).json({ error: 'El nombre debe tener al menos 3 caracteres' });
        }
        if (!validarMail(emailRegex, updateUser) && updateUser.email !== undefined) {
            return res.status(400).json({ error: 'El formato del mail no es correcto' });
        }

        users = users.map(user =>
            user.id === userId ? {...user, ...updateUser} : user
        );
        fs.writeFile(usersFilePath, JSON.stringify(users, null, 2), (err) => {
            if (err) {
                return res.status(500).json({ error: 'Error al cambiar el usuario' });
            }
            res.json(users.find(u => u.id === userId));
        });
    });
});

app.delete('/users/:id', (req, res) => {
    const userId = parseInt(req.params.id, 10);
    fs.readFile(usersFilePath, 'utf-8', (err, data) => {
        if (err) {
            return res.status(500).json({ error: 'Error con la conexión de datos' });
        }
        let users = JSON.parse(data);
        if(!users.some(user => user.id === userId)) {
            return res.status(404).json({ error: `ID ${userId} no existe` });
        }
        users = users.filter(user => user.id !== userId);
            fs.writeFile(usersFilePath, JSON.stringify(users, null, 2), (err) => {
            if (err) {
                return res.status(500).json({ error: 'Error al eliminar usuario' });
            }
            res.status(200).json(`Usuario ${userId} eliminado`);
        });
    });
});

app.get('/error', (req, res, next) => {
    next(new Error('Error intencional'));
})

app.get('/db-users', async (req, res) => {
    try{
        const users = await prisma.user.findMany();
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: 'Error al comunicarse con la base de datos' });
    }
});

app.get('/protected-route', authenticateToken, (req, res) => {
    res.send('Esta ruta esta protegida');
});

app.post('/register', async (req, res) => {
    const { email, password, name } = req.body;
    const hashPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create ({
        data: {
            email,
            password: hashPassword,
            name,
            role: 'USER'
        }
    })
    res.status(201).json({ message: 'User registered successfully' });
});

app.post('/login', async (req, res) => {
    const {email, password} = req.body;
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user)
        res.status(400).json({ error: 'Invalid email or password' });

    const validPassword = await bcrypt.compare(password, user.password);

    if(!validPassword) res.status(400).json({ error: 'Invalid email or password' });

    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '4h' });

    res.json({ token });
});


app.listen(PORT, () => {
    console.log('Nuestra app esta funcionando en el puerto:', PORT);
})