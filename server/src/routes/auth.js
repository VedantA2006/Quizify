const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { validate } = require('../middleware/validate');
const { authLimiter } = require('../middleware/rateLimiter');
const authController = require('../controllers/authController');
const { auth } = require('../middleware/auth');

router.post('/register', authLimiter, validate([
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
]), authController.register);

router.post('/login', authLimiter, validate([
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
]), authController.login);

router.get('/me', auth, authController.getMe);
router.put('/profile', auth, authController.updateProfile);

router.post('/forgot-password', authLimiter, validate([
  body('email').isEmail().withMessage('Valid email is required'),
]), authController.forgotPassword);

router.post('/reset-password/:token', authLimiter, validate([
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
]), authController.resetPassword);

module.exports = router;
