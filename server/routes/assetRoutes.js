import express from 'express';
// עליך לייבא את updateAsset למרות שאינו בשימוש
import { createAsset, getAssets, updateAsset, deleteAsset, deleteAllAssets } from '../controllers/assetController.js'; 
import { protect, restrictTo } from '../middleware/authMiddleware.js'; 

const router = express.Router();

// 1. Base routes: /api/assets (Plural endpoint)
router.route('/')
    .get(protect, getAssets) // GET: Restricted view based on role
    .post(protect, createAsset); // POST: Any logged-in user can create a new asset

// 2. Cleanup Route: /api/assets/admin/cleanup (Admin only, safer placement)
router.route('/admin/cleanup')
    .delete(protect, restrictTo('Admin'), deleteAllAssets);

// 3. Detail routes: /api/assets/:id (Singular endpoint)
router.route('/:id')

    .delete(protect, restrictTo('Admin'), deleteAsset); // DELETE: Single asset deletion

export default router;