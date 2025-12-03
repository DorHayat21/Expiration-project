import Catalog from '../models/Catalog.model.js';

// @desc    Create a new Catalog item (Domain/Topic/Default Days)
// @route   POST /api/catalog
// @access  Private/Admin
const createCatalogItem = async (req, res) => {
    // We already have the user object in req.user from the protect middleware
    const { domain, topic, defaultExpirationDays } = req.body;

    // 1. Simple Validation
    if (!domain || !topic || !defaultExpirationDays) {
        return res.status(400).json({ message: 'Please include domain, topic, and expiration days.' });
    }

    try {
        // 2. Create the item in the DB
        const catalogItem = await Catalog.create({
            domain,
            topic,
            defaultExpirationDays,
            createdBy: req.user._id, // Set the creator ID from the authenticated user
        });

        res.status(201).json(catalogItem);
    } catch (error) {
        // Handle Mongoose validation errors (e.g., topic not unique, invalid enum)
        if (error.code === 11000) {
            return res.status(400).json({ message: 'A catalog topic with this name already exists.' });
        }
        res.status(500).json({ message: `Failed to create catalog item: ${error.message}` });
    }
};

// @desc    Get all Catalog items (used for UI dropdowns)
// @route   GET /api/catalog
// @access  Private
const getCatalogItems = async (req, res) => {
    try {
        const catalogItems = await Catalog.find({}).select('-createdBy'); // Exclude the createdBy field in the initial fetch

        res.status(200).json(catalogItems);
    } catch (error) {
        res.status(500).json({ message: `Failed to fetch catalog items: ${error.message}` });
    }
};

// @desc    Update an existing Catalog item
// @route   PUT /api/catalog/:id
// @access  Private/Admin
const updateCatalogItem = async (req, res) => {
    try {
        const updatedItem = await Catalog.findByIdAndUpdate(req.params.id, req.body, {
            new: true, // Return the updated document
            runValidators: true, // Ensure Mongoose validators (like enum) run on update
        });

        if (!updatedItem) {
            return res.status(404).json({ message: 'Catalog item not found.' });
        }

        res.status(200).json(updatedItem);
    } catch (error) {
        res.status(500).json({ message: `Failed to update catalog item: ${error.message}` });
    }
};

// @desc    Delete a Catalog item
// @route   DELETE /api/catalog/:id
// @access  Private/Admin
const deleteCatalogItem = async (req, res) => {
    try {
        const item = await Catalog.findById(req.params.id);

        if (!item) {
            return res.status(404).json({ message: 'Catalog item not found.' });
        }
        
        // Delete the item from the database
        await item.deleteOne(); 

        res.status(200).json({ id: req.params.id, message: 'Catalog item deleted successfully.' });
    } catch (error) {
        res.status(500).json({ message: `Failed to delete catalog item: ${error.message}` });
    }
};

// Update the exports block at the end of the file
export {
    createCatalogItem,
    getCatalogItems,
    updateCatalogItem,
    deleteCatalogItem // NEW EXPORT
};
