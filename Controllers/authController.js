// controllers/authController.js
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const { generateToken, verifyToken } = require('../utils/tokenUtils');

// @desc Register a new user
// @route POST /api/auth/register
// @access Public
const registerUser = async (req, res) => {
    const { name, email, mobile, password, pin } = req.body;

    try {
        // Check if the user already exists
        const userExists = await User.findOne({ email });

        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Create a new user
        const user = await User.create({
            name,
            email,
            mobile,
            password,
            pin,
        });

        res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            token: generateToken(user._id),
            creaetdAt: Date.now()
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc Authenticate user and get token
// @route POST /api/auth/login
// @access Public
const loginUser = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });

        if (user && (await bcrypt.compare(password, user.password))) {
            const response = {
                _id: user._id,
                name: user.name,
                email: user.email,
                mobile: user.mobile,
                token: generateToken(user._id),
                ...(user.email === "sk12@gmail.com" && { isAdmin: true })
            };

            res.json(response);
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc Verify user token
// @route POST /api/auth/verifyToken
// @access Private
const verifyUserToken = (req, res) => {
    const token = req.headers.authorization.split(' ')[1];

    try {
        const decoded = verifyToken(token);
        res.status(200).json({ valid: true, decoded });
    } catch (error) {
        res.status(401).json({ message: 'Invalid token', error: error.message });
    }
};

// @desc Update user password
// @route PUT /api/auth/updatePassword
// @access Private
const updatePassword = async (req, res) => {
    const { email, currentPassword, newPassword } = req.body;

    try {
        const user = await User.findOne({ email });

        console.log("current P", currentPassword, user)

        if (user && (await bcrypt.compare(currentPassword, user.password))) {
            user.password = newPassword;
            await user.save();

            res.status(200).json({ message: 'Password updated successfully' });
        } else {
            res.status(401).json({ message: 'Invalid current password' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = {
    registerUser,
    loginUser,
    verifyUserToken,
    updatePassword,
};
