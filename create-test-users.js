#!/usr/bin/env node

/**
 * Create test users for carpooling tests
 */

const mysql = require('mysql2/promise');

const DB_CONFIG = {
    host: 'localhost',
    user: 'root',
    password: 'adminroot',
    database: 'taxi_carpooling'
};

async function createTestUsers() {
    let connection;
    
    try {
        console.log('🔗 Connecting to database...');
        connection = await mysql.createConnection(DB_CONFIG);
        
        // Create test users
        const users = [
            {
                id: 1,
                firstName: 'Anna',
                lastName: 'Andersson',
                email: 'anna@example.com',
                phone: '073-123-4567',
                personnummer: '195001011234',
                address: 'Mölndal Centrum 1',
                city: 'Mölndal',
                postalCode: '43130',
                eligibilityType: 'SENIOR',
                userType: 'PASSENGER',
                needsAssistance: true,
                needsWheelchairAccess: false
            },
            {
                id: 2,
                firstName: 'Erik',
                lastName: 'Eriksson',
                email: 'erik@example.com',
                phone: '073-234-5678',
                personnummer: '194505151234',
                address: 'Partille Torg 2',
                city: 'Partille',
                postalCode: '43340',
                eligibilityType: 'SENIOR',
                userType: 'PASSENGER',
                needsAssistance: true,
                needsWheelchairAccess: false
            },
            {
                id: 3,
                firstName: 'Astrid',
                lastName: 'Nilsson',
                email: 'astrid@example.com',
                phone: '073-345-6789',
                personnummer: '194012121234',
                address: 'Kungsbacka Station 3',
                city: 'Kungsbacka',
                postalCode: '43430',
                eligibilityType: 'SENIOR',
                userType: 'PASSENGER',
                needsAssistance: true,
                needsWheelchairAccess: false
            },
            {
                id: 4,
                firstName: 'Lars',
                lastName: 'Larsson',
                email: 'lars@example.com',
                phone: '073-456-7890',
                personnummer: '198505051234',
                address: 'Göteborg Centrum 4',
                city: 'Göteborg',
                postalCode: '41103',
                eligibilityType: 'STANDARD',
                userType: 'DRIVER',
                needsAssistance: false,
                needsWheelchairAccess: false
            }
        ];
        
        for (const user of users) {
            // Check if user exists
            const [existing] = await connection.execute(
                'SELECT id FROM users WHERE id = ?',
                [user.id]
            );
            
            if (existing.length > 0) {
                console.log(`👤 User ${user.id} (${user.firstName}) already exists`);
                continue;
            }
            
            // Insert user
            await connection.execute(`
                INSERT INTO users (
                    id, first_name, last_name, email, phone, personnummer,
                    address, city, postal_code, eligibility_type, user_type,
                    needs_assistance, needs_wheelchair_access, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
            `, [
                user.id, user.firstName, user.lastName, user.email, user.phone,
                user.personnummer, user.address, user.city, user.postalCode,
                user.eligibilityType, user.userType, user.needsAssistance,
                user.needsWheelchairAccess
            ]);
            
            console.log(`✅ Created user ${user.id}: ${user.firstName} ${user.lastName} (${user.userType})`);
        }
        
        console.log('🎉 All test users created successfully!');
        
    } catch (error) {
        console.error('❌ Failed to create test users:', error.message);
        throw error;
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

if (require.main === module) {
    createTestUsers()
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
}

module.exports = { createTestUsers };