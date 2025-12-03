import mongoose from 'mongoose';

// Defines the core rules for asset types (e.g., 'Fire Extinguisher' expires in 30 days)
const CatalogSchema = new mongoose.Schema({
    domain: {
        type: String,
        required: [true, 'Domain is required'],
        trim: true,
        uppercase: true,
        // Enforces the fixed list of Domain categories (Quality, Safety, etc.)
        enum: ['QUALITY', 'SAFETY', 'LOGISTICS', 'LAB', 'DRIVING'], 
        message: '"{VALUE}" is not a valid Domain category.',
    },
    topic: {
        type: String,
        required: [true, 'Topic is required'],
        unique: true, // Ensures unique topic names within the catalog
        trim: true,
    },
    defaultExpirationDays: {
        type: Number,
        required: [true, 'Default expiration days are required'],
        min: 1, // Expiration must be at least one day
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Links this rule entry to the User who created it
        required: true,
    }
}, {
    // Adds 'createdAt' and 'updatedAt' fields automatically
    timestamps: true 
});

const Catalog = mongoose.model('Catalog', CatalogSchema);

export default Catalog;