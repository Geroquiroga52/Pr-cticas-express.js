const { Router } = require('express');
const { register, login } = require('../controllers/authController');
const authenticateToken = require('../middleware/auth');

const router = Router();

router.post('/register', register);
router.post('/login', login);

router.get('/protected-route', authenticateToken, (req, res) => {
    res.send('Esta ruta esta protegida');
});

module.exports = router;