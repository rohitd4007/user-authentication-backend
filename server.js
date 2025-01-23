// server.js
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const geoip = require('geoip-lite');

dotenv.config();

const app = express();
app.use(express.json());

const corsOptions = {
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders: 'Content-Type,Authorization',
    optionsSuccessStatus: 200
};

// Apply CORS middleware
app.use(cors(corsOptions));

// Connect to the database
connectDB();


// Trust proxy to get correct IP
app.set('trust proxy', true);

// Define a route to get location from IP
app.get('/api/location-from-ip', (req, res) => {
    const forwarded = req.headers['x-forwarded-for'];
    const ip = forwarded ? forwarded.split(',')[0] : req.ip; // Get client IP
    console.log("IP::", ip)
    const geo = geoip.lookup(ip);
    console.log("Geo::", geo)


    if (geo) {
        const { city, region, country, ll } = geo; // ll = [latitude, longitude]
        res.status(200).json({ city, region, country, latitude: ll[0], longitude: ll[1] });
    } else {
        res.status(404).json({ message: 'Location not found' });
    }
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/product', productRoutes)

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

module.exports = app;
