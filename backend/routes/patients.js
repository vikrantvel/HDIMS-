const express = require('express');
const router = express.Router();
const Patient = require('../models/Patient');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Alert = require('../models/Alert');

const checkThresholdAndAlert = async () => {
    try {
        const activeCases = await Patient.countDocuments({ status: 'Active' });
        const THRESHOLD = 10;
        if (activeCases > THRESHOLD) {
            const existingAlert = await Alert.findOne({ type: 'threshold', isRead: false });
            if (!existingAlert) {
                await Alert.create({
                    title: 'Current Threshold Exceeded',
                    message: `Active cases have exceeded the limit (${activeCases} cases active). Please take action.`,
                    type: 'threshold'
                });
            }
        }
    } catch (e) {
        console.error('Alert check failed', e);
    }
};

// Middleware to protect routes
const protect = async (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
            req.user = await User.findById(decoded.id).select('-password');
            if (!req.user) {
                return res.status(401).json({ message: 'User not found' });
            }
            next();
        } catch (error) {
            return res.status(401).json({ message: 'Not authorized, token failed' });
        }
    } else {
        return res.status(401).json({ message: 'Not authorized, no token' });
    }
};

// Create a new patient record
router.post('/', protect, async (req, res) => {
    try {
        const { name, age, disease, region, coordinates, locationName, severity, status } = req.body;
        const location = { type: 'Point', coordinates }; // [longitude, latitude]
        const patient = await Patient.create({
            name, age, disease, region: region || 'Central', location, locationName, severity: severity || 'Moderate', status: status || 'Active', recordedBy: req.user._id
        });
        await checkThresholdAndAlert();
        res.status(201).json(patient);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get all patient records
router.get('/', protect, async (req, res) => {
    try {
        const patients = await Patient.find().populate('recordedBy', 'name email').sort({ createdAt: -1 });
        res.json(patients);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Update a patient record
router.put('/:id', protect, async (req, res) => {
    try {
        const { name, age, disease, region, locationName, severity, status } = req.body;
        let updateData = { name, age, disease, region, locationName, severity, status };
        
        if (req.body.coordinates) {
            updateData.location = { type: 'Point', coordinates: req.body.coordinates };
        }

        const patient = await Patient.findByIdAndUpdate(req.params.id, updateData, { new: true });
        if (!patient) return res.status(404).json({ message: 'Patient not found' });
        
        await checkThresholdAndAlert();
        res.json(patient);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Delete a patient record
router.delete('/:id', protect, async (req, res) => {
    try {
        const patient = await Patient.findByIdAndDelete(req.params.id);
        if (!patient) return res.status(404).json({ message: 'Patient not found' });
        
        // Optionally update alerts, but delete wouldn't tip us OVER a threshold
        res.json({ message: 'Patient removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get stats & heatmap data
router.get('/stats', protect, async (req, res) => {
    try {
        const totalPatients = await Patient.countDocuments();
        const activeCases = await Patient.countDocuments({ status: 'Active' });
        
        // Group by disease for distribution
        const diseaseDistribution = await Patient.aggregate([
            { $group: { _id: '$disease', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);

        const regionStats = await Patient.aggregate([
            {
                $group: {
                    _id: '$region',
                    cases: { $sum: 1 },
                    active: { $sum: { $cond: [{ $eq: ['$status', 'Active'] }, 1, 0] } },
                    recovered: { $sum: { $cond: [{ $eq: ['$status', 'Recovered'] }, 1, 0] } }
                }
            }
        ]);

        const heatmapData = await Patient.find({ status: 'Active' }).select('patientId name disease location locationName status severity region');

        res.json({ totalPatients, activeCases, diseaseDistribution, regionStats, heatmapData });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
