import mongoose from 'mongoose';

// Defines the individual assets tracked in the system
const AssetSchema = new mongoose.Schema({
    // --- Identifiers ---
    companyAssetId: { // Internal company ID (מסח"א)
        type: String,
        required: [true, 'Company Asset ID is required'],
        unique: true, // Must be unique across all assets
        trim: true,
    },
    serialNumber: {
        type: String,
        trim: true,
    },
    
    // --- Relationships (The heart of the system) ---
    catalogId: { // Links to the specific rule from the Catalog collection
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Catalog',
        required: true,
    },
    assignedTo: { // Links to the User responsible for this item
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },

    // --- Date & Status Tracking ---
    lastInspectionDate: { // Date when the asset was last checked
        type: Date,
        required: true,
    },
    expirationDate: { // The calculated expiry date (פ"ת)
        type: Date,
        required: true,
    },
    isCurrentlyExpired: { // Boolean flag for quick filtering/alerts
        type: Boolean,
        default: false,
    },

    // --- Location & Metadata ---
    gaf: { // NEW FIELD: גף (e.g. אלקטרואופטיקה)
        type: String,
        required: [true, 'Gaf is required'],
        trim: true,
    },
    department: { // SECOND LEVEL: מחלקה (e.g. מסק"ר)
        type: String,
        required: [true, 'Department is required'],
        trim: true,
    },
    // REMOVED: squadNumber
}, {
    timestamps: true
});

const Asset = mongoose.model('Asset', AssetSchema);

export default Asset;