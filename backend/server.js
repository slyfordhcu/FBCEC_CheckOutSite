const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();

// Enable CORS for all origins (you can restrict this to your frontend domain later)
app.use(cors());

// CONFIGURATION - Replace these with your actual values
const APP_ID = '89fe081e66765a90dc96f0ee9a044dbad03598cb66f309676019c781471ad290';
const SECRET = 'pco_pat_d11414e5ee1d9df586b37f9d91045169a6c13718ab57eae2e3db61247e03e9f586bf8cdb';
const EVENT_ID = '683687';

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ 
    status: 'Server is running',
    message: 'Use /api/checkouts to get checkout data'
  });
});

// Main endpoint to get checkouts
app.get('/api/checkouts', async (req, res) => {
  try {
    // Create Basic Auth header
    const auth = Buffer.from(`${APP_ID}:${SECRET}`).toString('base64');
    
    // Build the API URL with filters
    const apiUrl = new URL('https://api.planningcenteronline.com/check-ins/v2/check_ins');
    apiUrl.searchParams.append('where[event_id]', EVENT_ID);
    apiUrl.searchParams.append('filter', 'checked_out');
    apiUrl.searchParams.append('order', '-checked_out_at');
    apiUrl.searchParams.append('per_page', '100');
    
    console.log(`Fetching from: ${apiUrl.toString()}`);
    
    // Make request to Planning Center API
    const response = await fetch(apiUrl.toString(), {
      headers: {
        'Authorization': `Basic ${auth}`,
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Planning Center API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    console.log(`Successfully fetched ${data.data ? data.data.length : 0} checkouts`);
    
    // Return the data to the frontend
    res.json(data);
    
  } catch (error) {
    console.error('Error fetching checkouts:', error);
    res.status(500).json({ 
      error: error.message,
      details: 'Failed to fetch checkout data from Planning Center'
    });
  }
});

// Optional: Endpoint to get all events (useful for debugging)
app.get('/api/events', async (req, res) => {
  try {
    const auth = Buffer.from(`${APP_ID}:${SECRET}`).toString('base64');
    
    const response = await fetch(
      'https://api.planningcenteronline.com/check-ins/v2/events',
      {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Accept': 'application/json'
        }
      }
    );
    
    if (!response.ok) {
      throw new Error(`Planning Center API error: ${response.status}`);
    }
    
    const data = await response.json();
    res.json(data);
    
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ error: error.message });
  }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`📍 Checkout endpoint: http://localhost:${PORT}/api/checkouts`);
  console.log(`📍 Events endpoint: http://localhost:${PORT}/api/events`);
});
