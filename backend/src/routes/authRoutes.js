const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const {
  validateRegistration,
  validateLogin,
  validateRefreshToken,
} = require('../validations/auth');
const { authenticateToken } = require('../middlewares/auth');

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [firstName, lastName, email, password]
 *             properties:
 *               firstName: { type: string }
 *               lastName: { type: string }
 *               email: { type: string, format: email }
 *               password: { type: string, minLength: 8 }
 *               role: { type: string }
 *     responses:
 *       201: { description: User registered successfully }
 *       400: { description: Validation error or duplicate email }
 */
router.post('/register', validateRegistration, authController.register);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login with email and password
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, format: email }
 *               password: { type: string }
 *     responses:
 *       200: { description: Login successful, returns tokens }
 *       401: { description: Invalid credentials }
 */
router.post('/login', validateLogin, authController.login);

/**
 * @swagger
 * /auth/refresh-token:
 *   post:
 *     summary: Refresh access token
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken: { type: string }
 *     responses:
 *       200: { description: New tokens issued }
 *       403: { description: Invalid refresh token }
 */
router.post('/refresh-token', validateRefreshToken, authController.refreshToken);

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Get current authenticated user
 *     tags: [Auth]
 *     responses:
 *       200: { description: Current user data }
 *       401: { description: Not authenticated }
 */
router.get('/me', authenticateToken, authController.getMe);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Logout and revoke current token
 *     tags: [Auth]
 *     responses:
 *       200: { description: Logged out successfully }
 *       401: { description: Not authenticated }
 */
router.post('/logout', authenticateToken, authController.logout);

module.exports = router;
