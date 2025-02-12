require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const morgan = require('morgan');
const compression = require('compression');

const app = express();
const PORT = process.env.PORT || 3000;
const API_URL = process.env.MEDICARE_API_URL;

app.use(cors());
app.use(express.static('public'));
app.use(morgan('dev'));
app.use(compression());

// API route to fetch Medicare data
app.get('/api/medicare-data', async (req, res) => {
    try {
        const response = await axios.get(API_URL, { timeout: 10000 });

        // Transform the data
        const transformedData = response.data.map(item => ({
            brand_name: item.Brnd_Name || 'Unknown',
            generic_name: item.Gnrc_Name || 'Unknown',
            manufacturer_name: item.Mftr_Name || 'Unknown',
            year: '2021',
            total_spending: parseFloat(item.Tot_Spndng_2021) || 0,
            total_dosage_units: parseInt(item.Tot_Dsg_Unts_2021) || 0,
            total_claims: parseInt(item.Tot_Clms_2021) || 0,
            beneficiary_count: parseInt(item.Tot_Benes_2021) || 0,
            avg_spending_per_dose: parseFloat(item.Avg_Spnd_Per_Dsg_Unt_Wghtd_2021) || 0,
            avg_spending_per_claim: parseFloat(item.Avg_Spnd_Per_Clm_2021) || 0,
            avg_spending_per_beneficiary: parseFloat(item.Avg_Spnd_Per_Bene_2021) || 0
        }));

        res.json(transformedData);
    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(error.response?.status || 500).json({
            error: 'Failed to fetch data',
            details: error.message
        });
    }
});

app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
}); 