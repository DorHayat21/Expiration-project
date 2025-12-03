import mongoose from 'mongoose';

// Definition of the User Schema
const UserSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [true, 'Email address is required'],
        unique: true, // Ensures every email is unique
        trim: true, // Removes leading/trailing whitespace
        lowercase: true, // Stores all emails in lowercase
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        // Note: The password will be hashed (encrypted) before saving to the DB.
    },
    role: {
        type: String,
        // Enforcing the three user types as defined in the project requirements
        enum: ['Admin', 'SuperViewer', 'User'],
        default: 'User',
        required: true,
    },
}, {
    // Mongoose will automatically add 'createdAt' and 'updatedAt' fields
    timestamps: true 
});

// Create and export the model
const User = mongoose.model('User', UserSchema);

export default User;