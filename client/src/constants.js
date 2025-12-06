// --- מבנה ארגוני (גף -> מחלקות) ---
export const ORG_STRUCTURE = {
    'אלקטרואופטיקה': ['מסק"ר', 'מאו"ר', 'מרכז לייזר', 'חווטות וסיבים'],
    'הגנה אווירית': ['מערכות הגנ"א', 'מבדקים', 'שכבה תחתונה', 'TRMC'],
    'נשק מונחה': ['הנדסת ניסויים ותאלמ"ג', 'אוויר - קרקע', 'אוויר - אוויר'],
    'לות"ם': ['מחסן מרכזי', 'מצ"מ', 'שליטה']
};

// --- תרגומים: תחומים ---
export const DOMAIN_TRANSLATIONS = {
    'SAFETY': 'בטיחות', 
    'DRIVING': 'נהיגה', 
    'LAB': 'מעבדה', 
    'LOGISTICS': 'לוגיסטיקה', 
    'QUALITY': 'איכות' 
};

// --- תרגומים: נושאים ---
export const TOPIC_TRANSLATIONS = {
    'Car Service': 'טיפול רכב', 
    'Driving License': 'רישיון נהיגה', 
    'Regulators': 'ווסטים', 
    'Private Warehouse': 'מחסן פרטי', 
    'Tool Cabinet': 'ארון כלים', 
    'Accessory Bags': 'תיקי אביזר', 
    'RCD': 'מפסק פחת', 
    'Soldering Station': 'עמדת הלחמה', 
    'ESD Station': 'עמדת ESD', 
    'Hazmat Cabinet': 'ארון חומ"ס', 
    'Extinguishers': 'מטפים' 
};

// --- צבעים לגרפים (אופציונלי, אם תרצה שיהיו אחידים בכל המערכת) ---
export const COLORS = {
    VALID: '#10B981',        // ירוק
    EXPIRING_SOON: '#EAB308', // צהוב
    EXPIRED: '#EF4444'       // אדום
};