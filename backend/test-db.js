require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const caPath = path.join(__dirname, 'ca.pem');

console.log('CA file:', caPath);
console.log('CA exists:', fs.existsSync(caPath));

const dbUrl = new URL(process.env.DATABASE_URL);

// Remove SSL parameters from the URL
dbUrl.search = '';

const client = new Client({
  host: dbUrl.hostname,
  port: dbUrl.port,
  database: dbUrl.pathname.slice(1),
  user: decodeURIComponent(dbUrl.username),
  password: decodeURIComponent(dbUrl.password),

  ssl: {
    rejectUnauthorized: true,
    ca: fs.readFileSync(caPath, 'utf8')
  }
});

async function testConnection() {
  try {
    await client.connect();

    const result = await client.query('SELECT NOW() AS current_time');

    console.log('✅ DATABASE CONNECTION SUCCESSFUL');
    console.log('Aiven PostgreSQL connected!');
    console.log('Server time:', result.rows[0].current_time);
  } catch (error) {
    console.log('❌ DATABASE CONNECTION FAILED');
    console.log('Message:', error.message);
    console.log('Code:', error.code);
  } finally {
    await client.end().catch(() => {});
  }
}

testConnection();