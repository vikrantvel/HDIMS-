const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

const connectDB = async () => {
    try {
        let uri = process.env.MONGO_URI;
        
        // Use Atlas if explicitly provided, else fallback to in-memory portable server
        if (uri && !uri.includes('127.0.0.1') && !uri.includes('localhost')) {
            const conn = await mongoose.connect(uri);
            console.log(`MongoDB Connected (External): ${conn.connection.host}`);
        } else {
            console.log('Starting portable in-memory MongoDB server for zero-config run...');
            const mongoServer = await MongoMemoryServer.create();
            uri = mongoServer.getUri();
            const conn = await mongoose.connect(uri);
            console.log(`MongoDB Connected (In-Memory Portability Mode): ${conn.connection.host}`);
        }
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

module.exports = connectDB;
