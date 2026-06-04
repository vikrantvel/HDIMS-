const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const autoSeed = require('./config/seedData');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/patients', require('./routes/patients'));
app.use('/api/users', require('./routes/users'));
app.use('/api/alerts', require('./routes/alerts'));

app.get('/', (req, res) => {
    res.send('HDIMS API is running...');
});

const PORT = process.env.PORT || 5000;

// Initialize DB and Auto-Seed
connectDB().then(async () => {
    await autoSeed();
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
});
