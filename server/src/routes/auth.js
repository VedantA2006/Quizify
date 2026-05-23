const express = require('express');
const router = express.Router();
const Joi = require('joi');
const { body } = require('express-validator');
const { validate, validateJoi } = require('../middleware/validate');
const { authLimiter } = require('../middleware/rateLimiter');
const authController = require('../controllers/authController');
const { auth } = require('../middleware/auth');

const registerSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).max(100).required(),
  institutionName: Joi.string().trim().max(100).optional(),
});

router.post('/register', authLimiter, validateJoi(registerSchema), authController.register);

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

router.post('/refresh-token', authLimiter, authController.refreshToken);

module.exports = router;
