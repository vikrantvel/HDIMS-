const express = require('express');
const router = express.Router();
const Alert = require('../models/Alert');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

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

const admin = (req, res, next) => {
    if (req.user && (req.user.role === 'admin' || req.user.role === 'super_admin')) {
        next();
    } else {
        res.status(403).json({ message: 'Not authorized as admin' });
    }
};

router.get('/', protect, async (req, res) => {
    try {
        const alerts = await Alert.find({ isRead: false }).sort({ createdAt: -1 });
        res.json(alerts);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.put('/:id/read', protect, async (req, res) => {
    try {
        const alert = await Alert.findById(req.params.id);
        if (!alert) return res.status(404).json({ message: 'Alert not found' });
        alert.isRead = true;
        await alert.save();
        res.json({ message: 'Alert marked as read' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
