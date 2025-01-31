//server code for site
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const http = require('http');
const app = express();
const port = process.env.port || 3000;
const WebSocket = require('ws');

// Disable the 'X-Powered-By' header for security
app.disable('x-powered-by');

// Allow CORS only from GitHub Pages domain
app.use(cors({
  origin: 'https://slyfordhcu.github.io' 
}));

// Set X-Content-Type-Options header to nosniff
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  next();
});

// Configure cache control
app.use((req, res, next) => {
  // Set Cache-Control headers
  res.set('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
  next();
});

// Load values from environment variables
const apiId = process.env.API_ID;
const apiSecret = process.env.API_SECRET;
const apiUrl = process.env.API_URL;

// Create HTTP server to use with both Express and WebSocket
const server = http.createServer(app);

// Create WebSocket server and attach it to the HTTP server
const wss = new WebSocket.Server({ server });

// Function to fetch data from the API
async function fetchDataFromAPI() {
  const auth = Buffer.from(`${apiId}:${apiSecret}`).toString('base64');
  
  try {
    const response = await axios.get(apiUrl, {
      headers: {
        Authorization: `Basic ${auth}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching data from API:', error);
    throw error;
  }
}

// Endpoint to fetch data from API via HTTP
app.get('/api/data', async (req, res) => {
  try {
    const data = await fetchDataFromAPI();
    res.json(data);
  } catch (error) {
    res.status(500).send('Error fetching data from API');
  }
});

// Handle WebSocket connections
wss.on('connection', ws => {
  console.log('New WebSocket connection established');

  // Send data to the client when they first connect
  fetchDataFromAPI()
    .then(data => ws.send(JSON.stringify(data)))
    .catch(error => ws.send(JSON.stringify({ error: 'Error fetching data from API' })));

  // Optionally, set up an interval to send updates every 5 seconds
  const interval = setInterval(() => {
    fetchDataFromAPI()
      .then(data => ws.send(JSON.stringify(data)))
      .catch(error => ws.send(JSON.stringify({ error: 'Error fetching data from API' })));
  }, 5000);

  // Clean up when the connection is closed
  ws.on('close', () => {
    clearInterval(interval);
    console.log('WebSocket connection closed');
  });
});

// Start the server
server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
