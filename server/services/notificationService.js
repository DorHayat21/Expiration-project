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
    
    // הגדרת טרנספורטר עבור GMAIL
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
        console.log(`✅ Email SENT to ${recipient} | Subject: ${subject}`);
    } catch (error) {
        console.error('❌ GMAIL ERROR:', error.response || error.message);
        // לא זורק שגיאה כדי לא לעצור את הלולאה של שאר המיילים
    }
};

// --- לוגיקת Cron Job ---
let adminEmails = [];

const checkAndSendNotifications = async () => {
    console.log('\n🔄 --- STARTING NOTIFICATION CHECK ---');
    
    // שליפת מנהלים פעם אחת לריצה
    adminEmails = await getAdminEmails();

    // בדיקת טווח של 30 יום קדימה (וגם כל מה שכבר פג תוקף בעבר)
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    // שליפת כל הנכסים הרלוונטיים
    const criticalAssets = await Asset.find({
        expirationDate: { $lte: thirtyDaysFromNow },
    })
    .populate('assignedTo', 'email')
    .populate('catalogId', 'topic defaultExpirationDays'); 

    if (criticalAssets.length === 0) {
        console.log('✅ No critical assets found today.');
        return;
    }
    
    console.log(`🔍 Found ${criticalAssets.length} potential assets. Checking conditions...`);
    let emailsSentCount = 0;

    for (const asset of criticalAssets) {
        if (!asset.assignedTo || !asset.catalogId) continue;
        
        const daysRemaining = getDaysRemaining(asset.expirationDate);
        const cycle = asset.catalogId.defaultExpirationDays;
        const assignedEmail = asset.assignedTo.email;
        const subjectParts = [];
        let shouldSend = false;

        // 1. לוגיקה לפג תוקף (כל יום שעובר והוא פג תוקף - שולח התראה)
        if (daysRemaining <= 0) {
            shouldSend = true;
            subjectParts.push('HIGH PRIORITY - EXPIRED');
        } 
        // 2. לוגיקה למחזורים קצרים (מתחת ל-30 יום)
        else if (cycle <= 30) { 
            if (daysRemaining === 3) { shouldSend = true; subjectParts.push('CRITICAL: 3 Days Left'); }
            else if (daysRemaining === 1) { shouldSend = true; subjectParts.push('FINAL NOTICE: 1 Day Left'); }
        }
        // 3. לוגיקה למחזורים ארוכים
        else { 
            if (daysRemaining === 7) { shouldSend = true; subjectParts.push('CRITICAL: 7 Days Left'); }
            else if (daysRemaining === 1) { shouldSend = true; subjectParts.push('FINAL NOTICE: 1 Day Left'); }
        }

        if (shouldSend) {
            emailsSentCount++;
            const topicHebrew = TOPIC_TRANSLATIONS[asset.catalogId.topic] || asset.catalogId.topic;
            
            // טקסט מותאם אם זה פג תוקף או עתידי
            const statusText = daysRemaining < 0 
                ? `❌ פג תוקף לפני ${Math.abs(daysRemaining)} ימים!` 
                : daysRemaining === 0 
                    ? `❌ פג תוקף היום!`
                    : `⚠️ יפוג בעוד ${daysRemaining} ימים.`;
                
            const subject = `[${subjectParts.join(' / ')}] - נכס #${asset.companyAssetId}`;
            
            const body = 
                `שלום ${asset.assignedTo.email},\n\n` +
                `יש לעדכן את הנכס הבא:\n` +
                `-----------------------------\n` +
                `📦 פריט: ${topicHebrew}\n` +
                `🔢 מסח"א: ${asset.companyAssetId}\n` +
                `🏢 מחלקה: ${asset.department}\n` +
                `📅 סטטוס: ${statusText}\n` +
                `-----------------------------\n\n` +
                `נא לטפל בהקדם,\nExpiryTrack System`;

            // סינון המקבל מרשימת ההעתקים כדי שלא יקבל פעמיים
            const ccRecipients = adminEmails.filter(email => email !== assignedEmail);
            
            // --- התיקון המרכזי: מחקנו את הבדיקה אם המייל כבר נשלח ---
            // שולחים מייל לכל פריט בנפרד
            await sendEmail(assignedEmail, subject, body, ccRecipients);
        }
    }
    console.log(`🏁 --- FINISHED. Sent ${emailsSentCount} emails. ---`);
};

const startScheduler = () => {
    // הרצה יומית ב-06:00
    cron.schedule('0 6 * * *', checkAndSendNotifications, {
        scheduled: true,
        timezone: "Asia/Jerusalem" 
    });
    console.log('⏰ Notification scheduler started. Runs daily at 06:00.');

    // *** שורה לבדיקה ***
    // תריץ את הפונקציה מיד כשהשרת עולה כדי לראות אם המיילים נשלחים עכשיו
    // (אחרי שתראה שזה עובד, אתה יכול למחוק את השורה למטה או לשים אותה בהערה)
    checkAndSendNotifications(); 
};

export default startScheduler;