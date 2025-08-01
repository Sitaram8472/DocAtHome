const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const sendEmail = require('../utils/sendEmail');

// @desc    Register a new user
// @route   POST /api/auth/register
exports.register = async (req, res) => {
  try {
    const { email } = req.body;

    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ msg: 'User already exists' });
    }

    // Create a new user with all data from the form
    user = new User(req.body);

    // Hashing is handled by the pre-save hook in User.js model
    await user.save();

    // Create token
    const payload = {
      user: {
        id: user.id,
        role: user.role,
      },
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '5h' },
      (err, token) => {
        if (err) throw err;
        res.status(201).json({ token });
      }
    );
  } catch (err) {
    // This is the most important part for debugging.
    // Check your backend terminal for this message.
    console.error('REGISTRATION ERROR:', err.message);
    res.status(500).send('Server error');
  }
};

// @desc    Authenticate user & get token (Login)
// @route   POST /api/auth/login
exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Find user by email, and explicitly include the password for comparison
    let user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(400).json({ msg: 'Invalid Credentials' });
    }

    // Use the matchPassword method from our User model
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid Credentials' });
    }

    // Check if the professional account is verified
    if ((user.role === 'doctor' || user.role === 'nurse') && !user.isVerified) {
      return res.status(401).json({ msg: 'Your account is pending admin approval.' });
    }

    // Create token
    const payload = {
      user: {
        id: user.id,
        role: user.role,
      },
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '5h' },
      (err, token) => {
        if (err) throw err;
        res.json({ token });
      }
    );
  } catch (err) {
    console.error('LOGIN ERROR:', err.message);
    res.status(500).send('Server error');
  }
};

// @desc    Get current logged-in user details
// @route   GET /api/auth/me
exports.getMe = async (req, res) => {
  try {
    // req.user is attached by our 'protect' middleware
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
        return res.status(404).json({ msg: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    console.error('GETME ERROR:', err.message);
    res.status(500).send('Server Error');
  }
};

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
exports.forgotPassword = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });

    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // Generate token
    const resetToken = crypto.randomBytes(20).toString('hex');

    // Hash token and set to user
    user.passwordResetToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    // Set expire time to 10 minutes
    user.passwordResetExpires = Date.now() + 10 * 60 * 1000;

    await user.save();

    // Create reset URL
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    const message = `You are receiving this email because you (or someone else) has requested the reset of a password. Please make a PUT request to: \n\n ${resetUrl}`;

    try {
      await sendEmail({
        email: user.email,
        subject: 'Password reset token',
        message,
      });

      res.status(200).json({ success: true, data: 'Email sent' });
    } catch (err) {
      console.error('EMAIL ERROR:', err);
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save();
      res.status(500).send('Email could not be sent');
    }
  } catch (err) {
    console.error('FORGOT PASSWORD ERROR:', err);
    res.status(500).send('Server error');
  }
};

// @desc    Reset password
// @route   POST /api/auth/reset-password/:token
exports.resetPassword = async (req, res) => {
  try {
    // Get hashed token
    const passwordResetToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    const user = await User.findOne({
      passwordResetToken,
      passwordResetExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ msg: 'Invalid token' });
    }

    // Set new password
    user.password = req.body.password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    res.status(200).json({ success: true, data: 'Password updated' });
  } catch (err) {
    console.error('RESET PASSWORD ERROR:', err);
    res.status(500).send('Server error');
  }
};
