import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [true, 'Email address is required'],
        unique: true,
        trim: true,
        lowercase: true,
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
    },
    role: {
        type: String,
        enum: ['Admin', 'SuperViewer', 'User'], // Admin=מנהל על, SuperViewer=מפקד גף, User=מפקד מחלקה
        default: 'User',
        required: true,
    },
    // --- שדות חדשים להיררכיה ---
    gaf: {
        type: String, 
        default: '' // למנהל מערכת זה יישאר ריק
    },
    department: {
        type: String,
        default: '' // למפקד גף זה יישאר ריק
    }
}, {
    timestamps: true 
});

const User = mongoose.model('User', UserSchema);

export default User;