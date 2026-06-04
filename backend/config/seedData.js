const User = require('../models/User');
const Patient = require('../models/Patient');

const autoSeed = async () => {
    try {
        const userCount = await User.countDocuments();
        if (userCount > 0) {
            console.log('Database already has data. Skipping auto-seed.');
            return;
        }

        console.log('Empty database detected. Auto-seeding comprehensive dataset...');
        
        // Seed Super Admin User
        const superAdminUser = await User.create({
            name: "System Super Admin",
            email: "super@hdims.com",
            password: "password123",
            role: "super_admin"
        });

        // Seed Admin User
        const adminUser = await User.create({
            name: "Admin User",
            email: "admin@hdims.com",
            password: "password123",
            role: "admin"
        });

        // Seed Staff User
        const staffUser = await User.create({
            name: "Staff User",
            email: "user@hdims.com",
            password: "password123",
            role: "staff"
        });

        const seedPatients = [
            // North Region (Delhi area)
            { patientId: "P001", name: "John Smith", age: 45, disease: "Influenza A", severity: "Moderate", region: "North", locationName: "Delhi", location: { type: "Point", coordinates: [77.100, 28.600] }, status: "Active", recordedBy: adminUser._id },
            { patientId: "P005", name: "Lisa Martinez", age: 35, disease: "Tuberculosis", severity: "Mild", region: "North", locationName: "Delhi", location: { type: "Point", coordinates: [77.150, 28.550] }, status: "Recovered", recordedBy: adminUser._id },
            { patientId: "P007", name: "Ahmed Khan", age: 52, disease: "Dengue Fever", severity: "Critical", region: "North", locationName: "Chandigarh", location: { type: "Point", coordinates: [76.779, 30.733] }, status: "Active", recordedBy: adminUser._id },
            
            // South Region (Chennai/Kerala area)
            { patientId: "P002", name: "Sarah Johnson", age: 32, disease: "COVID-19", severity: "Mild", region: "South", locationName: "Chennai", location: { type: "Point", coordinates: [80.200, 13.000] }, status: "Recovered", recordedBy: adminUser._id },
            { patientId: "P008", name: "Priya Raj", age: 29, disease: "COVID-19", severity: "Moderate", region: "South", locationName: "Bengaluru", location: { type: "Point", coordinates: [77.594, 12.971] }, status: "Active", recordedBy: adminUser._id },
            { patientId: "P009", name: "Kiran Kumar", age: 41, disease: "Malaria", severity: "Severe", region: "South", locationName: "Kochi", location: { type: "Point", coordinates: [76.267, 9.931] }, status: "Active", recordedBy: adminUser._id },

            // East Region (Kolkata)
            { patientId: "P003", name: "Michael Chen", age: 58, disease: "Pneumonia", severity: "Critical", region: "East", locationName: "Kolkata", location: { type: "Point", coordinates: [88.363, 22.572] }, status: "Active", recordedBy: adminUser._id },
            { patientId: "P010", name: "Amit Roy", age: 25, disease: "Malaria", severity: "Moderate", region: "East", locationName: "Bhubaneswar", location: { type: "Point", coordinates: [85.824, 20.296] }, status: "Active", recordedBy: adminUser._id },

            // West Region (Mumbai)
            { patientId: "P004", name: "Emily Davis", age: 27, disease: "Dengue Fever", severity: "Severe", region: "West", locationName: "Mumbai", location: { type: "Point", coordinates: [72.820, 19.000] }, status: "Active", recordedBy: adminUser._id },
            { patientId: "P011", name: "Rahul Patel", age: 34, disease: "COVID-19", severity: "Mild", region: "West", locationName: "Ahmedabad", location: { type: "Point", coordinates: [72.571, 23.022] }, status: "Recovered", recordedBy: adminUser._id },

            // Central Region (Bhopal/Nagpur)
            { patientId: "P006", name: "David Wilson", age: 41, disease: "Malaria", severity: "Moderate", region: "Central", locationName: "Bhopal", location: { type: "Point", coordinates: [77.412, 23.259] }, status: "Active", recordedBy: adminUser._id },
            { patientId: "P012", name: "Sneha Gupta", age: 22, disease: "Typhoid", severity: "Mild", region: "Central", locationName: "Nagpur", location: { type: "Point", coordinates: [79.088, 21.145] }, status: "Active", recordedBy: adminUser._id },
        ];

        await Patient.insertMany(seedPatients);
        console.log('Auto-seeding complete! 1 Super Admin, 1 Admin, 1 Staff and 12 Patients injected successfully.');
    } catch (error) {
        console.error('Error auto-seeding data:', error);
    }
};

module.exports = autoSeed;
