const mongoose = require('mongoose');

const patientSchema = mongoose.Schema({
    patientId: { type: String, unique: true },
    name: { type: String, required: true },
    age: { type: Number, required: true },
    disease: { type: String, required: true },
    region: { type: String, enum: ['North', 'South', 'East', 'West', 'Central'], default: 'Central' },
    location: {
        type: { type: String, enum: ['Point'], default: 'Point' },
        coordinates: { type: [Number], required: true } // [longitude, latitude]
    },
    locationName: { type: String },
    severity: { type: String, enum: ['Mild', 'Moderate', 'Severe', 'Critical'], default: 'Moderate' },
    status: { type: String, enum: ['Active', 'Recovered', 'Deceased'], default: 'Active' },
    recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

patientSchema.index({ location: '2dsphere' });

patientSchema.pre('save', async function() {
    if (!this.patientId) {
        const count = await mongoose.model('Patient').countDocuments();
        this.patientId = `P${String(count + 1).padStart(3, '0')}`;
    }
});

const Patient = mongoose.model('Patient', patientSchema);
module.exports = Patient;
