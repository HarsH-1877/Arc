"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = __importDefault(require("./config/database"));
async function testConnection() {
    try {
        // Test basic connection
        const result = await database_1.default.query('SELECT NOW()');
        console.log('✅ Database connected successfully');
        console.log('Current time:', result.rows[0].now);
        // Check if users table exists
        const tableCheck = await database_1.default.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'users'
            );
        `);
        if (tableCheck.rows[0].exists) {
            console.log('✅ Users table exists');
            // Get table structure
            const columns = await database_1.default.query(`
                SELECT column_name, data_type, is_nullable
                FROM information_schema.columns
                WHERE table_name = 'users'
                ORDER BY ordinal_position;
            `);
            console.log('\nUsers table structure:');
            columns.rows.forEach(col => {
                console.log(`  - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
            });
            // Check user count
            const count = await database_1.default.query('SELECT COUNT(*) FROM users');
            console.log(`\nTotal users: ${count.rows[0].count}`);
        }
        else {
            console.log('❌ Users table does NOT exist');
            console.log('\nPlease run the schema.sql file to create tables:');
            console.log('  psql -U postgres -d arc_db -f database/schema.sql');
        }
        database_1.default.end();
    }
    catch (error) {
        console.error('❌ Database error:', error.message);
        console.error('Full error:', error);
        process.exit(1);
    }
}
testConnection();
