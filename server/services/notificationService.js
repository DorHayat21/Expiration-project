import cron from 'node-cron';
import nodemailer from 'nodemailer';
import Asset from '../models/Asset.model.js';
import User from '../models/User.model.js';

// *** מילון תרגום ***
const TOPIC_TRANSLATIONS = {
    'Car Service': 'טיפול רכב', 'Driving License': 'רישיון נהיגה', 'Regulators': 'ווסטים', 'Private Warehouse': 'מחסן פרטי', 'Tool Cabinet': 'ארון כלים', 'Accessory Bags': 'תיקי אביזר', 'RCD': 'מפסק פחת', 'Soldering Station': 'עמדת הלחמה', 'ESD Station': 'עמדת ESD', 'Hazmat Cabinet': 'ארון חומ"ס', 'Extinguishers': 'מטפים',
};

// --- עזר: חישוב ימים שנותרו ---
const getDaysRemaining = (expirationDate) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(expirationDate);
    expiry.setHours(0, 0, 0, 0);
    const diffTime = expiry.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 3600 * 24));
};

// --- עזר: שליפת מיילים של מנהלים ---
const getAdminEmails = async () => {
     try {
         const adminUsers = await User.find({ 
            role: { $in: ['Admin', 'SuperViewer'] } 
         }, 'email'); 
         return adminUsers.map(u => u.email);
     } catch (error) {
         console.error("Error fetching admin emails:", error);
         return [];
     }
};

// ✅ פונקציית שליחת המייל (מותאמת ל-GMAIL)
export const sendEmail = async (recipient, subject, body, ccList = []) => {
    
    console.log('\n--- Gmail Email Attempt ---');
    console.log('User:', process.env.EMAIL_USER);

    // הגדרת טרנספורטר עבור GMAIL (הכי יציב)
    const transporter = nodemailer.createTransport({
        service: 'gmail', 
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS 
        }
    });

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: recipient,
        cc: ccList.join(', '),
        subject: subject,
        text: body,
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log(`✅ Email SENT via Gmail! ID: ${info.messageId}`);
    } catch (error) {
        console.error('❌ GMAIL ERROR:', error.response || error.message);
        throw error;
    }
};

// --- לוגיקת Cron Job ---
const notificationsSent = new Set(); 
let adminEmails = [];

const checkAndSendNotifications = async () => {
    console.log('--- CRON JOB: Running Expiration Check ---');
    notificationsSent.clear(); 
    adminEmails = await getAdminEmails();

    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const criticalAssets = await Asset.find({
        expirationDate: { $lte: thirtyDaysFromNow },
    })
    .populate('assignedTo', 'email')
    .populate('catalogId', 'topic defaultExpirationDays'); 

    if (criticalAssets.length === 0) {
        console.log('--- CRON JOB: No critical assets found. ---');
        return;
    }
    
    let processedCount = 0;

    for (const asset of criticalAssets) {
        if (!asset.assignedTo || !asset.catalogId) continue;
        
        const daysRemaining = getDaysRemaining(asset.expirationDate);
        const cycle = asset.catalogId.defaultExpirationDays;
        const assignedEmail = asset.assignedTo.email;
        const subjectParts = [];
        let shouldSend = false;

        if (daysRemaining <= 0) {
            shouldSend = true;
            subjectParts.push('HIGH PRIORITY - EXPIRED');
        } 
        else if (cycle <= 30) { 
            if (daysRemaining === 3) { shouldSend = true; subjectParts.push('CRITICAL: 3 Days Left'); }
            else if (daysRemaining === 1) { shouldSend = true; subjectParts.push('FINAL NOTICE: 1 Day Left'); }
        }
        else { 
            if (daysRemaining === 7) { shouldSend = true; subjectParts.push('CRITICAL: 7 Days Left'); }
            else if (daysRemaining === 1) { shouldSend = true; subjectParts.push('FINAL NOTICE: 1 Day Left'); }
        }

        if (shouldSend) {
            processedCount++;
            const topicHebrew = TOPIC_TRANSLATIONS[asset.catalogId.topic] || asset.catalogId.topic;
            const statusText = daysRemaining <= 0 ? `פג תוקף! (נא לטפל דחוף)` : `פג תוקף בעוד ${daysRemaining} ימים.`;
                
            const subject = `[${subjectParts.join(' / ')}] - נכס #${asset.companyAssetId}`;
            const body = 
                `שלום ${asset.assignedTo.email},\n\n` +
                `יש לעדכן את הנכס הבא:\n` +
                `פריט: ${topicHebrew}\n` +
                `מסח"א: ${asset.companyAssetId}\n` +
                `מחלקה: ${asset.department}\n` +
                `סטטוס: ${statusText}\n\n` +
                `בברכה,\nExpiryTrack System`;

            const ccRecipients = adminEmails.filter(email => email !== assignedEmail);
            
            if (!notificationsSent.has(assignedEmail)) {
                await sendEmail(assignedEmail, subject, body, ccRecipients).catch(err => console.error(`Cron Email Failed:`, err.message));
                notificationsSent.add(assignedEmail);
            }
        }
    }
    console.log(`--- CRON JOB: Finished. ${processedCount} processed. ---`);
};

const startScheduler = () => {
    cron.schedule('0 6 * * *', checkAndSendNotifications, {
        scheduled: true,
        timezone: "Asia/Jerusalem" 
    });
    console.log('Notification scheduler started. Runs daily at 06:00.');
};

export default startScheduler;