// server.js
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
app.use(bodyParser.json());
app.use(cors());

let submittedScores = {}; // In-memory storage for simplicity; use a database in production

// Endpoint to submit a new score
app.post('/api/submit', (req, res) => {
    const { url, score, user } = req.body;
    if (!url || !score || !user) {
        return res.status(400).json({ message: 'Missing required fields' });
    }
    submittedScores[url] = { score, user, approved: false };
    res.json({ message: 'Score submitted successfully' });
});

// Endpoint for admin to approve scores
app.post('/api/approve', (req, res) => {
    const { url } = req.body;
    if (submittedScores[url]) {
        submittedScores[url].approved = true;
        res.json({ message: 'Score approved successfully' });
    } else {
        res.status(404).json({ message: 'Score not found' });
    }
});

// Endpoint to fetch all scores
app.get('/api/scores', (req, res) => {
    res.json(submittedScores);
});

// Start the server
app.listen(3000, () => {
    console.log('Server is running on port 3000');
});
