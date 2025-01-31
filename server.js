// server.js
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const geoip = require('geoip-lite');
const { default: axios } = require('axios');

dotenv.config();

const app = express();
app.use(express.json());

const corsOptions = {
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders: 'Content-Type,Authorization',
    optionsSuccessStatus: 200
};

const GEOAPIFY_API_KEY = '19131a99d7ab41cc8b56c64cd05571fd'; // Replace with your key


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
    // console.log("IP::", ip)
    const geo = geoip.lookup(ip);
    // console.log("Geo::", geo)


    if (geo) {
        const { city, region, country, ll } = geo; // ll = [latitude, longitude]
        res.status(200).json({ city, region, country, latitude: ll[0], longitude: ll[1] });
    } else {
        res.status(404).json({ message: 'Location not found' });
    }
});

app.get('/api/search-location', async (req, res) => {
    const { query } = req.query;

    if (!query) {
        return res.status(400).json({ message: 'Location query is required' });
    }

    try {
        const response = await axios.get(`https://nominatim.openstreetmap.org/search`, {
            params: { q: query, format: 'json', limit: 5, countrycodes: 'IN' },
            headers: { 'User-Agent': 'YourApp/1.0' } // Required for Nominatim
        });

        res.json(response.data.map(place => ({
            name: place.display_name,
            lat: place.lat,
            lon: place.lon
        })));
    } catch (error) {
        console.error('Error fetching locations:', error);
        res.status(500).json({ message: 'Failed to fetch locations' });
    }
});


app.get('/api/nearby-mechanics', async (req, res) => {
    const { latitude, longitude } = req.query;

    if (!latitude || !longitude) {
        return res.status(400).json({ message: 'Latitude and Longitude are required' });
    }

    try {
        const response = await axios.get(
            `https://api.geoapify.com/v2/places`,
            {
                params: {
                    categories: 'commercial.vehicle',
                    filter: `circle:${longitude},${latitude},15000`,
                    limit: 10,
                    apiKey: GEOAPIFY_API_KEY,
                }
            }
        );

        const mechanics = response.data.features.map((place) => ({
            name: place.properties.name || 'Unknown',
            address: place.properties.street || 'No address',
            city: place.properties.city || 'No city',
            country: place.properties.country || 'No country',
            latitude: place.properties.lat,
            longitude: place.properties.lon,
        }));

        res.status(200).json(mechanics);
    } catch (error) {
        console.error('Error fetching nearby mechanics:', error);
        res.status(500).json({ message: 'Error fetching nearby mechanics' });
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
