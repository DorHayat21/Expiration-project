import Asset from '../models/Asset.model.js';
import Catalog from '../models/Catalog.model.js';
import { sendEmail } from '../services/notificationService.js'; 

const TOPIC_TRANSLATIONS = {
    'Car Service': 'טיפול רכב', 'Driving License': 'רישיון נהיגה', 'Regulators': 'ווסטים', 'Private Warehouse': 'מחסן פרטי', 'Tool Cabinet': 'ארון כלים', 'Accessory Bags': 'תיקי אביזר', 'RCD': 'מפסק פחת', 'Soldering Station': 'עמדת הלחמה', 'ESD Station': 'עמדת ESD', 'Hazmat Cabinet': 'ארון חומ"ס', 'Extinguishers': 'מטפים',
};

const calculateExpiryDate = (inspectionDate, defaultDays) => {
    const date = new Date(inspectionDate);
    date.setDate(date.getDate() + defaultDays);
    return date;
};

// @desc    Create a new Asset item
const createAsset = async (req, res) => {
    let { 
        companyAssetId, serialNumber, catalogId, 
        lastInspectionDate, gaf, department 
    } = req.body;

    // --- אכיפת הרשאות ביצירה (לוגיקה מתוקנת) ---
    const userRole = req.user.role;
    const userGaf = req.user.gaf;
    const userDept = req.user.department;

    // אם זה משתמש רגיל - הוא חייב ליצור בגף ובמחלקה שלו
    if (userRole === 'User') {
        gaf = userGaf;
        department = userDept;
    }
    // אם זה מפקד גף (SuperViewer) שיש לו גף מוגדר - הוא נעול לגף שלו, אבל יכול לבחור מחלקה
    else if (userRole === 'SuperViewer' && userGaf) {
        gaf = userGaf;
        // department נשאר מה שהגיע מה-Body (הוא יכול לבחור מחלקה)
    }
    // אם זה Admin או SuperViewer ראשי (בלי גף) - הם יכולים לבחור הכל חופשי (gaf ו-department נלקחים מה-Body)

    if (!companyAssetId || !catalogId || !lastInspectionDate || !department || !gaf) {
        return res.status(400).json({ message: 'Please include all required fields.' });
    }

    try {
        const catalogRule = await Catalog.findById(catalogId);
        if (!catalogRule) {
            return res.status(404).json({ message: 'Catalog rule not found.' });
        }

        const expirationDate = calculateExpiryDate(lastInspectionDate, catalogRule.defaultExpirationDays);

        const asset = await Asset.create({
            companyAssetId, 
            serialNumber, 
            catalogId,
            lastInspectionDate, 
            expirationDate, 
            gaf, 
            department, 
            assignedTo: req.user._id,
        });

        // שליחת מייל אישור
        const topicHebrew = TOPIC_TRANSLATIONS[catalogRule.topic] || catalogRule.topic;
        const subject = `[אישור] נכס חדש #${asset.companyAssetId} נוצר בהצלחה`;
        const body = 
            `שלום ${req.user.email},\n\n` +
            `הפריט הבא נוצר על ידך במערכת:\n` +
            `פריט: ${topicHebrew}\n` +
            `מסח"א: ${asset.companyAssetId}\n` +
            `גף: ${gaf}\n` +
            `מחלקה: ${department}\n` +
            `תאריך פ"ת: ${new Date(asset.expirationDate).toLocaleDateString('he-IL')}\n\n` +
            `בברכה,\nExpiryTrack System`;

        sendEmail(req.user.email, subject, body, []).catch(console.error);
        
        res.status(201).json(asset);
    } catch (error) {
        if (error.code === 11000) return res.status(400).json({ message: `Asset ID exists.` });
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get assets based on hierarchy
const getAssets = async (req, res) => {
    const { role, gaf, department } = req.user;
    let filter = {};

    // --- לוגיקת ההיררכיה (החלק החשוב שתוקן) ---
    if (role === 'Admin') {
        // מנהל מערכת: רואה הכל
        filter = {}; 
    } 
    else if (role === 'SuperViewer') {
        // בדיקה קריטית: האם למפקד הגף יש בכלל גף מוגדר?
        if (gaf && gaf.trim() !== '') {
            // יש גף מוגדר -> מסננים לפי הגף הזה
            filter = { gaf: gaf }; 
        } else {
            // אין גף מוגדר (הבוסית הגדולה) -> מראים הכל (כמו אדמין)
            filter = {};
        }
    } 
    else {
        // משתמש רגיל: רואה רק את המחלקה שלו בגף שלו
        filter = { gaf: gaf, department: department };
    }

    try {
        const assets = await Asset.find(filter)
            .populate('catalogId', 'domain topic defaultExpirationDays')
            .populate('assignedTo', 'email role')
            .sort({ expirationDate: 1 }); 

        res.status(200).json(assets);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const updateAsset = async (req, res) => {
    try {
        const { lastInspectionDate, catalogId } = req.body;
        let updateFields = { ...req.body };
        delete updateFields.assignedTo; 
        delete updateFields.expirationDate; 
        
        if (lastInspectionDate || catalogId) {
            const currentAsset = await Asset.findById(req.params.id);
            if (!currentAsset) return res.status(404).json({ message: 'Not found' });
            
            const ruleId = catalogId || currentAsset.catalogId;
            const catalogRule = await Catalog.findById(ruleId);
            const newInspectionDate = lastInspectionDate || currentAsset.lastInspectionDate;

            updateFields.expirationDate = calculateExpiryDate(newInspectionDate, catalogRule.defaultExpirationDays);
        }

        const updatedAsset = await Asset.findByIdAndUpdate(req.params.id, updateFields, { new: true, runValidators: true })
          .populate('catalogId', 'domain topic defaultExpirationDays')
          .populate('assignedTo', 'email role'); 

        if (!updatedAsset) return res.status(404).json({ message: 'Not found' });
        res.status(200).json(updatedAsset);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const deleteAsset = async (req, res) => {
    try {
        const asset = await Asset.findByIdAndDelete(req.params.id);
        if (!asset) return res.status(404).json({ message: 'Not found' });
        res.status(200).json({ message: 'Removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const deleteAllAssets = async (req, res) => {
    try {
        await Asset.deleteMany({});
        res.status(200).json({ message: 'All deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export { createAsset, getAssets, updateAsset, deleteAsset, deleteAllAssets };