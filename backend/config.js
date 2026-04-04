// config.js
require('dotenv').config();
const { Pool } = require('pg');

const isProduction = process.env.NODE_ENV === 'production';
const isRenderDB = (process.env.DATABASE_URL || '').includes('render.com');

// Create a PostgreSQL connection pool
const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: (isProduction || isRenderDB) ? { rejectUnauthorized: false } : false,
});

// Test the database connection
db.connect()
  .then(() => console.log('✅ Connected to PostgreSQL database'))
  .catch(err => console.error('❌ Error connecting to PostgreSQL:', err.message));

module.exports = db;
