const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const Institution = require('../models/Institution');
const RefreshToken = require('../models/RefreshToken');
const env = require('../config/env');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const { generateSlug } = require('../utils/helpers');
const nodemailer = require('nodemailer');

const generateToken = (user) => {
  // Access token expires in 15 minutes as per Phase 1 instructions
  return jwt.sign({ id: user._id, role: user.role }, env.JWT_SECRET, { expiresIn: '15m' });
};

const generateRefreshToken = async (user, res) => {
  const tokenString = crypto.randomBytes(40).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(tokenString).digest('hex');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  await RefreshToken.create({
    userId: user._id,
    token: hashedToken,
    expiresAt,
  });

  res.cookie('refreshToken', tokenString, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'strict',
    expires: expiresAt,
  });

  return tokenString;
};

exports.register = async (req, res, next) => {
  try {
    const { name, email, password, role, institutionName } = req.body;

    const existing = await User.findOne({ email });
    if (existing) throw ApiError.badRequest('Email already registered');

    // Parse and validate role
    const userRole = role && ['institution_owner', 'faculty', 'student'].includes(role) ? role : 'student';

    // Create the user
    const user = await User.create({ name, email, password, role: userRole });

    if (userRole === 'institution_owner' && institutionName) {
      // Create new institution owned by this user
      const slug = generateSlug(institutionName);
      let uniqueSlug = slug;
      let counter = 1;
      while (await Institution.findOne({ slug: uniqueSlug })) {
        uniqueSlug = `${slug}-${counter}`;
        counter++;
      }

      const inst = await Institution.create({
        name: institutionName,
        slug: uniqueSlug,
        owner: user._id,
      });

      user.institution = inst._id;
      await user.save();
    } else {
      // Auto-assign faculty/students to first demo institution for immediate usability
      const demoInst = await Institution.findOne({ name: /Demo|Quzify|Quizify/i }) || await Institution.findOne();
      if (demoInst) {
        user.institution = demoInst._id;
        await user.save();
      }
    }

    const token = generateToken(user);
    await generateRefreshToken(user, res);

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
    await generateRefreshToken(user, res);
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

    const resetUrl = `${env.CLIENT_URL}/reset-password/${resetToken}`;

    const transporter = nodemailer.createTransport({
      host: env.EMAIL_HOST,
      port: env.EMAIL_PORT,
      auth: {
        user: env.EMAIL_USER,
        pass: env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: env.EMAIL_FROM,
      to: user.email,
      subject: 'Reset your Quizify password',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #4f46e5; text-align: center;">Quizify Password Reset</h2>
          <p>Hello ${user.name},</p>
          <p>You requested a password reset for your Quizify account. Please click the button below to reset your password. This link is valid for 1 hour.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Reset Password</a>
          </div>
          <p>If the button doesn't work, you can copy and paste the following link into your browser:</p>
          <p style="word-break: break-all; color: #64748b;">${resetUrl}</p>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
          <p style="font-size: 12px; color: #64748b;">If you did not request a password reset, please ignore this email.</p>
        </div>
      `,
    };

    try {
      await transporter.sendMail(mailOptions);
    } catch (mailErr) {
      console.error('Mail sending failed:', mailErr);
      throw ApiError.internal('Failed to send password reset email');
    }

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

exports.refreshToken = async (req, res, next) => {
  try {
    const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;
    if (!refreshToken) throw ApiError.unauthorized('Refresh token is required');

    const hashedToken = crypto.createHash('sha256').update(refreshToken).digest('hex');
    const tokenRecord = await RefreshToken.findOne({
      token: hashedToken,
      expiresAt: { $gt: Date.now() },
      isRevoked: false,
    });

    if (!tokenRecord) throw ApiError.unauthorized('Invalid or expired refresh token');

    const user = await User.findById(tokenRecord.userId);
    if (!user || !user.isActive) throw ApiError.unauthorized('User account is invalid or deactivated');

    // Revoke current token
    tokenRecord.isRevoked = true;
    await tokenRecord.save();

    // Generate new pairs
    const newAccessToken = generateToken(user);
    await generateRefreshToken(user, res);

    ApiResponse.success(res, { token: newAccessToken }, 'Token refreshed successfully');
  } catch (error) {
    next(error);
  }
};
