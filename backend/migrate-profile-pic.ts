import pool from './src/config/database';

async function addProfilePictureColumn() {
    try {
        await pool.query(`
            ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_picture_url VARCHAR(500);
        `);
        console.log('✅ Successfully added profile_picture_url column to users table');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error adding column:', error);
        process.exit(1);
    }
}

addProfilePictureColumn();
