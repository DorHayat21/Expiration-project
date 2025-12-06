import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs'; 
import User from './models/User.model.js'; 

dotenv.config(); 

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error connecting to MongoDB: ${error.message}`);
        process.exit(1);
    }
};

const seedUsers = async () => {
    
    // הגדרת משתמשים עם תפקידים ושיוכים לגפים/מחלקות
    const initialUsers = [
        { 
            email: 'dorhayat14@gmail.com', 
            password: '123', 
            role: 'Admin',
            gaf: '',        // אדמין לא צריך שיוך
            department: '' 
        }, 
        { 
            email: 'eyal@gmail.com', 
            password: '123', 
            role: 'SuperViewer', // מפקד גף
            gaf: 'אלקטרואופטיקה', // רואה את כל המחלקות תחת הגף הזה
            department: ''       // לא מוגבל למחלקה ספציפית
        }, 
        { 
            email: 'perah@gmail.com', 
            password: '123', 
            role: 'SuperViewer', // מפקדת יחידה
            gaf: '', // רואה את כל המחלקות   
            department: ''       // לא מוגבל למחלקה ספציפית
        }, 
        { 
            email: 'moshe@gmail.com', 
            password: '123', 
            role: 'User',        // מפקד מחלקה
            gaf: 'אלקטרואופטיקה',
            department: 'מסק"ר' // רואה רק פריטים של מסק"ר
        }, 
        { 
            email: 'yahav@gmail.com', 
            password: '123', 
            role: 'User',        // מפקד 
            gaf: 'אלקטרואופטיקה',
            department: 'מסק"ר' // רואה רק פריטים של מסק"ר
        }, 
        { 
            email: 'or@gmail.com', 
            password: '123', 
            role: 'User',        // מפקד מחלקה
            gaf: 'אלקטרואופטיקה',
            department: 'מסק"ר' // רואה רק פריטים של מסק"ר
        }, 
        { 
            email: 'sidi@gmail.com', 
            password: '123', 
            role: 'User',        // 
            gaf: 'אלקטרואופטיקה',
            department: 'מרכז לייזר' // רואה רק פריטים של מרכז לייזר
        }, 
        { 
            email: 'roi@gmail.com', 
            password: '123', 
            role: 'User',        // משתמש
            gaf: 'הגנה אווירית',
            department: 'TRMC' // רואה רק פריטים של TRMC
        }, 
    ];

    
    
    try {
        // מחיקת משתמשים קיימים
        await User.deleteMany(); 
        console.log('Existing users deleted.');

        const usersToCreate = [];
        
        for (const user of initialUsers) {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(user.password, salt);
            
            usersToCreate.push({
                ...user,
                password: hashedPassword 
            });
        }

        // הכנסת המשתמשים החדשים למסד הנתונים
        await User.insertMany(usersToCreate);
        console.log(`Successfully added ${usersToCreate.length} users to the database!`);
        process.exit(0); 
        
    } catch (error) {
        console.error('Error during seeding:', error);
        process.exit(1);
    }
};

connectDB().then(seedUsers);