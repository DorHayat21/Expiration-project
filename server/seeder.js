import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs'; 
// CRITICAL: Must use .js extension for local imports in ES Modules
import User from './models/User.model.js'; 

// Load environment variables from the .env file
dotenv.config(); 

// Function to connect to MongoDB
const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error connecting to MongoDB: ${error.message}`);
        process.exit(1);
    }
};

// Function to create users in bulk
const seedUsers = async () => {
    
    // 1. Define 3 key users (Admin, SuperViewer, User)
    const initialUsers = [
        { email: 'dorhayat14@gmail.com', password: '123', role: 'Admin' }, 
        { email: 'dorhayat1@gmail.com', password: '123', role: 'SuperViewer' }, 
        { email: 'dorhayat99@gmail.com', password: '123', role: 'User' }, 
    ];

    // 2. Create 7 additional regular employee users (10 total)
    const NUM_EMPLOYEES = 7;
    for (let i = 1; i <= NUM_EMPLOYEES; i++) {
        initialUsers.push({
            email: `employee${i}@company.com`,
            password: '123', 
            role: 'User' 
        });
    }
    
    try {
        // Delete all existing users before seeding
        await User.deleteMany(); 
        console.log('Existing users deleted.');

        const usersToCreate = [];
        // Hash the password for each user
        for (const user of initialUsers) {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(user.password, salt);
            
            usersToCreate.push({
                ...user,
                password: hashedPassword 
            });
        }

        // Insert all 10 users
        await User.insertMany(usersToCreate);
        console.log(`Successfully added ${usersToCreate.length} users to the database!`);
        process.exit(0); 
        
    } catch (error) {
        console.error('Error during seeding:', error);
        process.exit(1);
    }
};

// Start the process
connectDB().then(seedUsers);

