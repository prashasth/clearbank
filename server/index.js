require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const express = require('express');
const cors = require('cors');
const fse = require('fs-extra');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Ensure data directory exists on startup
fse.ensureDir(path.join(__dirname, '../data')).catch(console.error);

// Routes
app.use('/api/admin', require('./routes/admin'));
app.use('/api/env', require('./routes/env'));
app.use('/api/wizard', require('./routes/wizard'));
app.use('/api/inbox', require('./routes/inbox'));
app.use('/api/verify', require('./routes/auth'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, data: { status: 'ok', port: PORT } });
});

app.listen(PORT, () => {
  console.log(`ClearBank server running on http://localhost:${PORT}`);
});
