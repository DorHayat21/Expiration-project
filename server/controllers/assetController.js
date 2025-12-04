import Asset from '../models/Asset.model.js';
import Catalog from '../models/Catalog.model.js';
import { sendEmail } from '../services/notificationService.js'; 

// מילון התרגום עבור המיילים
const TOPIC_TRANSLATIONS = {
    'Car Service': 'טיפול רכב', 'Driving License': 'רישיון נהיגה', 'Regulators': 'ווסטים', 'Private Warehouse': 'מחסן פרטי', 'Tool Cabinet': 'ארון כלים', 'Accessory Bags': 'תיקי אביזר', 'RCD': 'מפסק פחת', 'Soldering Station': 'עמדת הלחמה', 'ESD Station': 'עמדת ESD', 'Hazmat Cabinet': 'ארון חומ"ס', 'Extinguishers': 'מטפים',
};

// Utility function to calculate the expiration date
const calculateExpiryDate = (inspectionDate, defaultDays) => {
    const date = new Date(inspectionDate);
    date.setDate(date.getDate() + defaultDays);
    return date;
};

// @desc    Create a new Asset item
// @route   POST /api/assets
// @access  Private (User, SuperViewer, Admin)
const createAsset = async (req, res) => {
    // 1. קבלת הנתונים מהבקשה (הוספנו את gaf, הורדנו את squadNumber)
    const { 
        companyAssetId, serialNumber, catalogId, 
        lastInspectionDate, 
        gaf,         // שדה חדש
        department   // שדה קיים
    } = req.body;

    // 2. בדיקת תקינות (Validation) - הוספנו בדיקה ל-gaf
    if (!companyAssetId || !catalogId || !lastInspectionDate || !department || !gaf) {
        return res.status(400).json({ message: 'Please include all required asset fields (including Gaf and Department).' });
    }

    try {
        const catalogRule = await Catalog.findById(catalogId);
        if (!catalogRule) {
            return res.status(404).json({ message: 'Catalog rule not found.' });
        }

        const expirationDate = calculateExpiryDate(
            lastInspectionDate, 
            catalogRule.defaultExpirationDays
        );

        // 3. יצירת הפריט במסד הנתונים
        const asset = await Asset.create({
            companyAssetId, 
            serialNumber, 
            catalogId,
            lastInspectionDate, 
            expirationDate, 
            gaf,        // שמירת הגף
            department, // שמירת המחלקה
            assignedTo: req.user._id,
        });

        // ✅ שליחת מייל אישור
        const topicHebrew = TOPIC_TRANSLATIONS[catalogRule.topic] || catalogRule.topic;
        const subject = `[אישור] נכס חדש #${asset.companyAssetId} נוצר בהצלחה`;
        const body = 
            `שלום ${req.user.email},\n\n` +
            `הפריט הבא נוצר על ידך במערכת:\n` +
            `פריט: ${topicHebrew}\n` +
            `מסח"א: ${asset.companyAssetId}\n` +
            `גף: ${gaf}\n` +      // הוספתי למייל
            `מחלקה: ${department}\n` + // הוספתי למייל
            `תאריך פ"ת: ${new Date(asset.expirationDate).toLocaleDateString('he-IL')}\n\n` +
            `המערכת תשלח התראות לפני פג תוקף.\n\n` +
            `בברכה,\nExpiryTrack System`;

        sendEmail(req.user.email, subject, body, []).catch(err => {
            console.error('Failed to send instant email on asset creation:', err);
        });
        
        res.status(201).json(asset);
    } catch (error) {
        if (error.code === 11000) {
             return res.status(400).json({ message: `Asset with ID ${companyAssetId} already exists.` });
        }
        res.status(500).json({ message: `Failed to create asset: ${error.message}` });
    }
};

// @desc    Get assets based on user role
// @route   GET /api/assets
// @access  Private (Role-dependent)
const getAssets = async (req, res) => {
    const userRole = req.user.role;
    let filter = {};

    if (userRole === 'User') {
        filter.assignedTo = req.user._id;
    } 

    try {
        const assets = await Asset.find(filter)
            .populate('catalogId', 'domain topic defaultExpirationDays')
            .populate('assignedTo', 'email role')
            .sort({ expirationDate: 1 }); 

        res.status(200).json(assets);
    } catch (error) {
        res.status(500).json({ message: `Failed to fetch assets: ${error.message}` });
    }
};

// @desc    Update an existing asset
// @route   PUT /api/assets/:id
// @access  Private (Role-dependent)
const updateAsset = async (req, res) => {
    try {
        const { lastInspectionDate, catalogId } = req.body;
        
        let updateFields = { ...req.body };

        delete updateFields.assignedTo; 
        delete updateFields.expirationDate; 
        
        // עדכון תאריך תפוגה אם שונה תאריך בדיקה או קטלוג
        if (lastInspectionDate || catalogId) {
            const currentAsset = await Asset.findById(req.params.id);
            if (!currentAsset) {
                return res.status(404).json({ message: 'Asset not found.' });
            }
            
            const ruleId = catalogId || currentAsset.catalogId;
            const catalogRule = await Catalog.findById(ruleId);
            const newInspectionDate = lastInspectionDate || currentAsset.lastInspectionDate;

            updateFields.expirationDate = calculateExpiryDate(
                newInspectionDate, 
                catalogRule.defaultExpirationDays
            );
        }

        const updatedAsset = await Asset.findByIdAndUpdate(req.params.id, updateFields, {
            new: true,
            runValidators: true,
        })
          .populate('catalogId', 'domain topic defaultExpirationDays')
          .populate('assignedTo', 'email role'); 

        if (!updatedAsset) {
            return res.status(404).json({ message: 'Asset not found.' });
        }

        res.status(200).json(updatedAsset);
    } catch (error) {
        res.status(500).json({ message: `Failed to update asset: ${error.message}` });
    }
};

const deleteAsset = async (req, res) => {
    try {
        const asset = await Asset.findByIdAndDelete(req.params.id);
        
        if (!asset) {
            return res.status(404).json({ message: 'Asset not found.' });
        }

        res.status(200).json({ message: 'Asset successfully removed' });
    } catch (error) {
        res.status(500).json({ message: `Failed to delete asset: ${error.message}` });
    }
};

const deleteAllAssets = async (req, res) => {
    try {
        await Asset.deleteMany({});
        res.status(200).json({ message: 'All assets deleted successfully.' });
    } catch (error) {
        res.status(500).json({ message: `Failed to delete all assets: ${error.message}` });
    }
};

export {
    createAsset,
    getAssets,
    updateAsset,
    deleteAsset,
    deleteAllAssets
};