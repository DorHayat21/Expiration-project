import React, { useState, useEffect } from 'react';
import axios from 'axios';

// --- הגדרת המבנה הארגוני (היררכיה) ---
const ORG_STRUCTURE = {
    'אלקטרואופטיקה': ['מסק"ר', 'מאו"ר', 'מרכז לייזר', 'חווטות וסיבים'],
    'הגנה אווירית': ['מערכות הגנ"א', 'מבדקים', 'שכבה תחתונה', 'TRMC'],
    'נשק מונחה': ['הנדסת ניסויים ותאלמ"ג', 'אוויר - קרקע', 'אוויר - אוויר'],
    'לות"ם': ['מחסן מרכזי', 'מצ"מ', 'שליטה']
};

// --- מילונים לתרגום ערכים לעברית ---
const DOMAIN_TRANSLATIONS = {
    'SAFETY': 'בטיחות',
    'DRIVING': 'נהיגה',
    'LAB': 'מעבדה',
    'LOGISTICS': 'לוגיסטיקה',
    'QUALITY': 'איכות',
};

const TOPIC_TRANSLATIONS = {
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
    'Extinguishers': 'מטפים',
};

// --- פונקציית עזר לפענוח הטוקן (גרסה תומכת עברית!) ---
const parseJwt = (token) => {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));

        return JSON.parse(jsonPayload);
    } catch (e) {
        return null;
    }
};

// פונקציית עזר לשליפת הטוקן
const getAuthToken = () => {
    return localStorage.getItem('adminToken') || localStorage.getItem('userToken');
};

const NewAssetModal = ({ onClose, onAssetCreated }) => {
    
    // ניהול ה-State של הטופס
    const [formData, setFormData] = useState({
        companyAssetId: '',
        serialNumber: '',
        domain: '',
        catalogId: '',
        lastInspectionDate: '',
        gaf: '',        
        department: '',  
    });
    
    const [catalogRules, setCatalogRules] = useState([]);
    const [availableTopics, setAvailableTopics] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    
    // משתנה לניהול הרשאות
    const [isRestrictedUser, setIsRestrictedUser] = useState(false);

    // 1. טעינת נתונים ראשונית (חוקים + זיהוי משתמש)
    useEffect(() => {
        const token = getAuthToken(); 
        
        // א. זיהוי המשתמש והגדרת ברירות מחדל
        if (token) {
            const userData = parseJwt(token);
            // בדיקה אם המשתמש הוא User רגיל
            if (userData && userData.role === 'User') {
                setIsRestrictedUser(true);
                // עדכון הנתונים בטופס אוטומטית לפי הטוקן
                setFormData(prev => ({
                    ...prev,
                    gaf: userData.gaf || '',
                    department: userData.department || ''
                }));
            }
        }

        // ב. שליפת חוקי קטלוג
        const fetchRules = async () => {
            if (!token) {
                 setError('שגיאת אימות: אנא התחבר מחדש.');
                 return;
            }

            try {
                const config = { headers: { Authorization: `Bearer ${token}` } };
                const response = await axios.get('http://localhost:5000/api/catalog', config);
                setCatalogRules(response.data); 
            } catch (err) {
                console.error("Failed to fetch catalog rules:", err);
                setError('שגיאה בטעינת כללי קטלוג.');
            }
        };
        fetchRules();
    }, []);

    // 2. סינון נושאים לפי בחירת תחום
    useEffect(() => {
        if (formData.domain) {
            const filteredTopics = catalogRules.filter(
                rule => rule.domain === formData.domain
            );
            setAvailableTopics(filteredTopics);
            setFormData(prev => ({ ...prev, catalogId: '' })); // איפוס נושא
        } else {
            setAvailableTopics([]);
        }
    }, [formData.domain, catalogRules]);


    // עדכון שדות הקלט (כללי)
    const onChange = (e) => {
        setFormData(prev => ({
            ...prev,
            [e.target.name]: e.target.value,
        }));
    };

    // טיפול ספציפי בשינוי גף (רלוונטי רק למנהלים שיכולים לשנות)
    const handleGafChange = (e) => {
        setFormData(prev => ({
            ...prev,
            gaf: e.target.value,
            department: '' // איפוס מחלקה כשהגף משתנה
        }));
    };
    
    // 3. שליחת הטופס
    const onSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        
        const token = getAuthToken();
        
        const assetData = { 
            companyAssetId: formData.companyAssetId,
            serialNumber: formData.serialNumber,
            catalogId: formData.catalogId,
            lastInspectionDate: formData.lastInspectionDate,
            gaf: formData.gaf,
            department: formData.department
        };
        
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const response = await axios.post('http://localhost:5000/api/assets', assetData, config);
            
            if (response.status === 201) {
                onAssetCreated(response.data); 
                onClose(); 
            }

        } catch (err) {
            console.error("Asset Creation Error:", err);
            setError(err.response?.data?.message || 'שגיאה ביצירת פריט.');
        } finally {
            setIsLoading(false);
        }
    };

    // רשימת תחומים ייחודיים
    const uniqueDomains = [...new Set(catalogRules.map(rule => rule.domain))];

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 backdrop-blur-sm animate-fade-in">
            <div className="bg-[#162b4d] p-8 rounded-2xl shadow-2xl w-full max-w-xl border border-[#1f3c73] relative">
                
                <h2 className="text-2xl font-bold text-white mb-6 text-center">יצירת פריט מעקב חדש</h2>
                
                <button 
                    type="button" 
                    onClick={onClose} 
                    className="absolute top-4 left-4 text-gray-400 hover:text-white text-2xl transition duration-200"
                >
                    &times;
                </button>

                {error && <div className="bg-red-900/50 border border-red-500 text-red-200 p-3 rounded mb-4 text-center text-sm">{error}</div>}

                <form onSubmit={onSubmit} className="space-y-4 text-right" dir="rtl">
                    
                    {/* שדות זיהוי */}
                    <div className="grid grid-cols-2 gap-4">
                        <input
                            type="text" name="companyAssetId" placeholder="מספר זיהוי (מסח''א)" onChange={onChange} required
                            className="w-full px-4 py-3 bg-[#0e1a2b] text-white rounded-lg border border-gray-600 placeholder-gray-400 focus:border-cyan-400 focus:outline-none"
                        />
                        <input
                            type="text" name="serialNumber" placeholder="מספר סידורי" onChange={onChange}
                            className="w-full px-4 py-3 bg-[#0e1a2b] text-white rounded-lg border border-gray-600 placeholder-gray-400 focus:border-cyan-400 focus:outline-none"
                        />
                    </div>

                    {/* בחירת תחום ונושא */}
                    <div className="grid grid-cols-2 gap-4">
                        <select name="domain" onChange={onChange} required value={formData.domain}
                            className="w-full px-4 py-3 bg-[#0e1a2b] text-white rounded-lg border border-gray-600 focus:border-cyan-400 focus:outline-none"
                        >
                            <option value="">בחר תחום:</option>
                            {uniqueDomains.map(d => (
                                <option key={d} value={d}>{DOMAIN_TRANSLATIONS[d] || d}</option>
                            ))}
                        </select>
                        
                        <select name="catalogId" onChange={onChange} required value={formData.catalogId} disabled={!formData.domain}
                            className="w-full px-4 py-3 bg-[#0e1a2b] text-white rounded-lg border border-gray-600 disabled:opacity-50 focus:border-cyan-400 focus:outline-none"
                        >
                            <option value="">{formData.domain ? 'בחר נושא:' : 'קודם בחר תחום'}</option>
                            {availableTopics.map(t => (
                                <option key={t._id} value={t._id}>
                                    {TOPIC_TRANSLATIONS[t.topic] || t.topic} ({t.defaultExpirationDays} ימים)
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* --- אזור הגף והמחלקה (עם כותרות קבועות) --- */}
                    <div className="grid grid-cols-2 gap-4">
                        
                        {/* תצוגת גף */}
                        {isRestrictedUser ? (
                            // למשתמש מוגבל - נציג אינפוט רגיל ונעול
                            <div className="relative">
                                {/* תווית צפה מעל השדה */}
                                <div className="absolute -top-2.5 right-2 bg-[#162b4d] px-1.5 text-xs font-bold text-cyan-400 z-10">
                                    גף
                                </div>
                                <input 
                                    type="text" 
                                    value={formData.gaf} 
                                    disabled 
                                    className="w-full px-4 py-3 bg-[#0e1a2b]/50 text-gray-300 rounded-lg border border-gray-600/50 cursor-not-allowed font-medium"
                                />
                            </div>
                        ) : (
                            // למנהל - נציג בחירה
                            <select name="gaf" onChange={handleGafChange} required value={formData.gaf}
                                className="w-full px-4 py-3 bg-[#0e1a2b] text-white rounded-lg border border-gray-600 focus:border-cyan-400 focus:outline-none"
                            >
                                <option value="">בחר גף:</option>
                                {Object.keys(ORG_STRUCTURE).map(gaf => (
                                    <option key={gaf} value={gaf}>{gaf}</option>
                                ))}
                            </select>
                        )}

                        {/* תצוגת מחלקה */}
                        {isRestrictedUser ? (
                            // למשתמש מוגבל - נציג אינפוט רגיל ונעול
                            <div className="relative">
                                {/* תווית צפה מעל השדה */}
                                <div className="absolute -top-2.5 right-2 bg-[#162b4d] px-1.5 text-xs font-bold text-cyan-400 z-10">
                                    מחלקה
                                </div>
                                <input 
                                    type="text" 
                                    value={formData.department} 
                                    disabled 
                                    className="w-full px-4 py-3 bg-[#0e1a2b]/50 text-gray-300 rounded-lg border border-gray-600/50 cursor-not-allowed font-medium"
                                />
                            </div>
                        ) : (
                            // למנהל - נציג בחירה
                            <select name="department" onChange={onChange} required value={formData.department} disabled={!formData.gaf}
                                className="w-full px-4 py-3 bg-[#0e1a2b] text-white rounded-lg border border-gray-600 disabled:opacity-50 focus:border-cyan-400 focus:outline-none"
                            >
                                <option value="">{formData.gaf ? 'בחר מחלקה:' : 'קודם בחר גף'}</option>
                                {formData.gaf && ORG_STRUCTURE[formData.gaf]?.map(dept => (
                                    <option key={dept} value={dept}>{dept}</option>
                                ))}
                            </select>
                        )}
                    </div>

                    {/* תאריך בדיקה */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">תאריך ביצוע בדיקה</label>
                        <input
                            type="date" 
                            name="lastInspectionDate" 
                            onChange={onChange} 
                            required
                            style={{ colorScheme: 'dark' }}
                            className="w-full px-4 py-3 bg-[#0e1a2b] text-white rounded-lg border border-gray-600 focus:border-cyan-400 focus:outline-none cursor-pointer"
                        />
                         <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                            <span className="text-cyan-500">*</span>
                            שימו לב: פורמט התאריך (יום/חודש) מוצג בהתאם להגדרות המחשב שלכם.
                        </p>
                    </div>
                    
                    {/* כפתורים */}
                    <div className="flex justify-end gap-4 pt-6 border-t border-gray-700/50 mt-4">
                        <button type="button" onClick={onClose} className="py-2 px-6 rounded-lg text-gray-300 bg-gray-700 hover:bg-gray-600 transition duration-200">
                            ביטול
                        </button>
                        <button type="submit" disabled={isLoading} className="py-2 px-6 rounded-lg text-white bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 disabled:opacity-50 transition duration-200 font-bold shadow-lg">
                            {isLoading ? 'יוצר...' : 'צור פריט חדש'}
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
};

export default NewAssetModal;