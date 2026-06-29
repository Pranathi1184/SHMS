const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const {
  validateRegistration,
  validateLogin,
  validateRefreshToken,
} = require('../validations/auth');
const { authenticateToken } = require('../middlewares/auth');

router.post('/register', validateRegistration, authController.register);
router.post('/login', validateLogin, authController.login);
router.post('/refresh-token', validateRefreshToken, authController.refreshToken);
router.get('/me', authenticateToken, authController.getMe);

module.exports = router;
