import express from 'express';
import { createCatalogItem, getCatalogItems, updateCatalogItem, deleteCatalogItem } from '../controllers/catalogController.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';

const router = express.Router();

// Publicly available routes (read-only for all logged-in users)
router.route('/')
    .get(protect, getCatalogItems) // Accessible by any logged-in user
    .post(protect, restrictTo('Admin'), createCatalogItem); // ONLY Admin can create items

// Update/Delete routes
router.route('/:id')
    .put(protect, restrictTo('Admin'), updateCatalogItem); // ONLY Admin can update items

// Detail routes (PUT and DELETE)
router.route('/:id')
    .put(protect, restrictTo('Admin'), updateCatalogItem) 
    .delete(protect, restrictTo('Admin'), deleteCatalogItem); // NEW DELETE ROUTE

export default router;