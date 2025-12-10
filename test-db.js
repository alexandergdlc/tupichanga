const sql = require('mssql');

const config = {
    user: 'sa',
    password: '12345',
    server: 'DESKTOP-B02GQUG',
    database: 'TuPichangaDB',
    options: {
        encrypt: true,
        trustServerCertificate: true // Change to false to test
    }
};

async function connect() {
    try {
        console.log('Connecting...');
        let pool = await sql.connect(config);
        console.log('Connected successfully!');
        await pool.close();
    } catch (err) {
        console.error('Connection failed:', err);
    }
}

connect();
