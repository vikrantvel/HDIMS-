const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');

const protect = async (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
            req.user = await User.findById(decoded.id).select('-password');
            if (!req.user) return res.status(401).json({ message: 'User not found' });
            next();
        } catch (error) {
            return res.status(401).json({ message: 'Not authorized, token failed' });
        }
    } else {
        return res.status(401).json({ message: 'Not authorized, no token' });
    }
};

const superAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'super_admin') {
        next();
    } else {
        res.status(403).json({ message: 'Not authorized as super admin' });
    }
};

// Get all users
router.get('/', protect, superAdmin, async (req, res) => {
    try {
        const users = await User.find({}).select('-password');
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Update user role
router.put('/:id/role', protect, superAdmin, async (req, res) => {
    try {
        const { role } = req.body;
        if (!['staff', 'admin', 'super_admin'].includes(role)) {
            return res.status(400).json({ message: 'Invalid role' });
        }
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        user.role = role;
        await user.save();
        res.json({ _id: user._id, name: user.name, email: user.email, role: user.role });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
