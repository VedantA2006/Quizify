const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const Institution = require('../models/Institution');
const env = require('../config/env');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const { generateSlug } = require('../utils/helpers');

const generateToken = (user) => {
  return jwt.sign({ id: user._id, role: user.role }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });
};

exports.register = async (req, res, next) => {
  try {
    const { name, email, password, role, institutionName, institutionType } = req.body;

    const existing = await User.findOne({ email });
    if (existing) throw ApiError.badRequest('Email already registered');

    const user = await User.create({ name, email, password, role: role || 'student' });

    // For demo purposes, auto-assign to the first institution if not creating one
    if (role === 'institution_owner' && institutionName) {
      const institution = await Institution.create({
        name: institutionName,
        slug: generateSlug(institutionName) + '-' + Date.now().toString(36),
        owner: user._id,
        type: institutionType || 'other',
      });
      user.institution = institution._id;
      await user.save();
    } else {
      const demoInst = await Institution.findOne({ name: /Demo|Quzify/i });
      if (demoInst) {
        user.institution = demoInst._id;
        await user.save();
      }
    }

    const token = generateToken(user);
    ApiResponse.created(res, { user, token }, 'Registration successful');
  } catch (error) {
    next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user) throw ApiError.unauthorized('Invalid email or password');
    if (!user.isActive) throw ApiError.unauthorized('Account is deactivated');

    const isMatch = await user.comparePassword(password);
    if (!isMatch) throw ApiError.unauthorized('Invalid email or password');

    user.lastLogin = new Date();
    await user.save();

    const token = generateToken(user);
    const userData = user.toJSON();

    ApiResponse.success(res, { user: userData, token }, 'Login successful');
  } catch (error) {
    next(error);
  }
};

exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate('institution', 'name slug logo');
    ApiResponse.success(res, { user });
  } catch (error) {
    next(error);
  }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const { name, phone, bio } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, phone, bio },
      { new: true, runValidators: true }
    );
    ApiResponse.success(res, { user }, 'Profile updated');
  } catch (error) {
    next(error);
  }
};

exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return ApiResponse.success(res, null, 'If an account exists, a reset link has been sent');
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    // In production, send email with reset link
    // For now, return token in response (development only)
    const resetUrl = `${env.CLIENT_URL}/reset-password/${resetToken}`;

    ApiResponse.success(res, {
      ...(env.NODE_ENV === 'development' ? { resetToken, resetUrl } : {}),
    }, 'If an account exists, a reset link has been sent');
  } catch (error) {
    next(error);
  }
};

exports.resetPassword = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) throw ApiError.badRequest('Invalid or expired reset token');

    user.password = password;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    const newToken = generateToken(user);
    ApiResponse.success(res, { token: newToken }, 'Password reset successful');
  } catch (error) {
    next(error);
  }
};
