// Quick script to run database schema on Render PostgreSQL
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const DATABASE_URL = 'postgresql://arc_user:MuMiDBaNysXCkVwNS37IE2BRNFSPLrYj@dpg-d5psfdngi27c73ca85ug-a.oregon-postgres.render.com/arc_db_svgq';

async function runSchema() {
    const pool = new Pool({
        connectionString: DATABASE_URL,
        ssl: {
            rejectUnauthorized: false
        }
    });

    try {
        console.log('🔌 Connecting to Render PostgreSQL...');

        // Read schema file
        const schemaPath = path.join(__dirname, 'database', 'schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');

        console.log('📄 Running schema.sql...');

        // Execute schema
        await pool.query(schema);

        console.log('✅ Database schema created successfully!');

        // Verify tables
        const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);

        console.log('\n📊 Tables created:');
        result.rows.forEach(row => {
            console.log('  - ' + row.table_name);
        });

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    } finally {
        await pool.end();
        console.log('\n✅ Database setup complete!');
    }
}

runSchema();
