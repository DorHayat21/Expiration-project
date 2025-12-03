import React, { useState, useEffect } from 'react';
import axios from 'axios';

// --- MAPPING: Translate DB values to Hebrew UI text ---

// Map 1: Translates the large Domain categories (e.g., SAFETY)
const DOMAIN_TRANSLATIONS = {
    'SAFETY': 'בטיחות',
    'DRIVING': 'נהיגה',
    'LAB': 'מעבדה',
    'LOGISTICS': 'לוגיסטיקה',
    'QUALITY': 'איכות',
};

// Map 2: Translates the Topic names (e.g., Fire Extinguisher)
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
// --------------------------------------------------------

// ✅ פונקציית עזר: שולפת את הטוקן של המשתמש המחובר (Admin או User)
const getAuthToken = () => {
    return localStorage.getItem('adminToken') || localStorage.getItem('userToken');
};


const NewAssetModal = ({ onClose, onAssetCreated }) => {
    
    // Component state management
    const [formData, setFormData] = useState({
        companyAssetId: '',
        serialNumber: '',
        domain: '',
        catalogId: '',
        lastInspectionDate: '',
        department: '',
        squadNumber: '',
    });
    
    // Loading, error, and data states
    const [catalogRules, setCatalogRules] = useState([]);
    const [availableTopics, setAvailableTopics] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    // --- 1. Fetch all catalog rules from the API (Runs once on load) ---
    useEffect(() => {
        const fetchRules = async () => {
            const token = getAuthToken(); 
            if (!token) {
                 setError('שגיאת אימות: אנא התחבר מחדש.');
                 return;
            }

            try {
                const config = { headers: { Authorization: `Bearer ${token}` } };
                const response = await axios.get('/api/catalog', config);
                setCatalogRules(response.data); // Store all rules
            } catch (err) {
                console.error("Failed to fetch catalog rules:", err);
                if (err.response && err.response.status === 401) {
                     setError('אין הרשאה. אנא התחבר מחדש.');
                } else {
                     setError('שגיאה בטעינת כללי קטלוג.');
                }
            }
        };
        fetchRules();
    }, []);

    // --- 2. Cascading Dropdown Logic (unchanged) ---
    useEffect(() => {
        if (formData.domain) {
            // Filter rules based on the selected Domain
            const filteredTopics = catalogRules.filter(
                rule => rule.domain === formData.domain
            );
            setAvailableTopics(filteredTopics);
            // Reset Topic selection when the Domain changes
            setFormData(prev => ({ ...prev, catalogId: '' }));
        } else {
            setAvailableTopics([]);
        }
    }, [formData.domain, catalogRules]);


    // Handle input changes (unchanged)
    const onChange = (e) => {
        setFormData(prev => ({
            ...prev,
            [e.target.name]: e.target.value,
        }));
    };
    
    // --- 3. Submission Logic (POST /api/assets) ---
    const onSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        
        const token = getAuthToken(); // ✅ שימוש בפונקציית הטוקן הגמישה
        if (!token) {
             setError('שגיאת אימות. נא להתחבר מחדש.');
             setIsLoading(false);
             return;
        }
        
        // Data payload includes the rule ID (catalogId)
        const assetData = { 
            ...formData, 
            catalogId: formData.catalogId, 
        };
        
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const response = await axios.post('/api/assets', assetData, config);
            
            if (response.status === 201) {
                onAssetCreated(response.data); // Update dashboard list
                onClose(); // Close modal on success
            }

        } catch (err) {
            console.error("Asset Creation Error:", err);
            // שיפור הצגת שגיאות מהשרת
            setError(err.response?.data?.message || 'שגיאה ביצירת פריט.');
        } finally {
            setIsLoading(false);
        }
    };

    // Get unique list of Domains for the primary dropdown (unchanged)
    const uniqueDomains = [...new Set(catalogRules.map(rule => rule.domain))];

    return (
        // Modal structure (unchanged)
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
            {/* Modal Content Container */}
            <div className="bg-[#162b4d] p-8 rounded-lg shadow-2xl w-full max-w-xl border border-[#1f3c73] relative">
                
                <h2 className="text-2xl font-bold text-white mb-6 text-center">יצירת פריט מעקב חדש</h2>
                
                {/* Close button (X icon) */}
                <button 
                    type="button" 
                    onClick={onClose} 
                    className="absolute top-4 left-4 text-gray-400 hover:text-white text-xl transition duration-200"
                >
                    &times;
                </button>

                {/* Error display */}
                {error && <div className="bg-red-800 text-white p-3 rounded mb-4 text-center">{error}</div>}

                <form onSubmit={onSubmit} className="space-y-4 text-right">
                    
                    {/* Input Fields (unchanged) */}
                    <input
                        type="text" name="companyAssetId" placeholder="מספר זיהוי (מסח''א)" onChange={onChange} required
                        className="w-full px-4 py-3 bg-gray-800 text-white rounded border border-gray-600 placeholder-gray-400 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition"
                    />
                    
                    <input
                        type="text" name="serialNumber" placeholder="מספר סידורי" onChange={onChange}
                        className="w-full px-4 py-3 bg-gray-800 text-white rounded border border-gray-600 placeholder-gray-400 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition"
                    />

                    {/* --- Cascading Dropdown Section --- */}
                    <div className="grid grid-cols-2 gap-4">
                        
                        {/* Domain Selection */}
                        <select name="domain" onChange={onChange} required value={formData.domain}
                            className="w-full px-4 py-3 bg-gray-800 text-white rounded border border-gray-600 focus:border-cyan-400 transition"
                        >
                            <option value="">בחר תחום (בטיחות, איכות...)</option>
                            {/* Renders the Hebrew name by mapping the English DB key (Map 1) */}
                            {uniqueDomains.map(d => (
                                <option key={d} value={d}>{DOMAIN_TRANSLATIONS[d] || d}</option>
                            ))}
                        </select>
                        
                        {/* Topic Selection (Filtered) */}
                        <select name="catalogId" onChange={onChange} required value={formData.catalogId} disabled={!formData.domain}
                            className="w-full px-4 py-3 bg-gray-800 text-white rounded border border-gray-600 disabled:opacity-50 focus:border-cyan-400 transition"
                        >
                            <option value="">בחר נושא...</option>
                            {/* Renders the Hebrew Topic name by mapping the English DB key (Map 2) */}
                            {availableTopics.map(t => (
                                <option key={t._id} value={t._id}>
                                    {TOPIC_TRANSLATIONS[t.topic] || t.topic} (תוקף: {t.defaultExpirationDays} ימים)
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Last Inspection Date */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300">תאריך ביצוע בדיקה</label>
                        <input
                            type="date" name="lastInspectionDate" onChange={onChange} required
                            className="mt-1 w-full px-4 py-3 bg-gray-800 text-white rounded border border-gray-600 focus:border-cyan-400 transition"
                        />
                    </div>
                    
                    {/* Department and Squad Number */}
                    <div className="grid grid-cols-2 gap-4">
                        <input
                            type="text" name="department" placeholder="מחלקה" onChange={onChange} required
                            className="w-full px-4 py-3 bg-gray-800 text-white rounded border border-gray-600 focus:border-cyan-400 transition"
                        />
                        <input
                            type="text" name="squadNumber" placeholder="מספר חולייה" onChange={onChange}
                            className="w-full px-4 py-3 bg-gray-800 text-white rounded border border-gray-600 focus:border-cyan-400 transition"
                        />
                    </div>


                    {/* Submit and Cancel Buttons */}
                    <div className="flex justify-end space-x-reverse space-x-4 pt-6 border-t border-gray-700/50 mt-4">
                        <button type="button" onClick={onClose} className="py-2 px-6 rounded text-gray-300 bg-gray-600 hover:bg-gray-700 transition duration-200">
                            ביטול
                        </button>
                        <button type="submit" disabled={isLoading} className="py-2 px-6 rounded text-white bg-green-600 hover:bg-green-700 disabled:bg-gray-500 transition duration-200 font-semibold">
                            {isLoading ? 'יוצר...' : 'צור פריט חדש'}
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
};

export default NewAssetModal;