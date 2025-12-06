import express from 'express';
// וודא שהפונקציה updateAsset מיובאת כאן
import { createAsset, getAssets, updateAsset, deleteAsset, deleteAllAssets } from '../controllers/assetController.js'; 
import { protect, restrictTo } from '../middleware/authMiddleware.js'; 

const router = express.Router();

// 1. Base routes: /api/assets
router.route('/')
    .get(protect, getAssets) 
    .post(protect, createAsset); 

// 2. Cleanup Route: /api/assets/admin/cleanup (Admin only)
router.route('/admin/cleanup')
    .delete(protect, restrictTo('Admin'), deleteAllAssets);

// 3. Detail routes: /api/assets/:id
router.route('/:id')
    // --- התיקון כאן: הוספנו את ה-put לעדכון ---
    .put(protect, updateAsset) 
    // ----------------------------------------
    .delete(protect, deleteAsset); 
    
export default router;