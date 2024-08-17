// routes/authRoutes.js
const express = require('express');
const {
    registerUser,
    loginUser,
    verifyUserToken,
} = require('../Controllers/authController');
const protect = require('../middlewares/authMiddleware');

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/verifyToken', protect, verifyUserToken);

module.exports = router;
