import React, { useState, useEffect } from 'react';

// פונקציית עזר לפענוח הטוקן (כדי להשיג את ה-ID של המשתמש)
const parseJwt = (token) => {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
        return JSON.parse(jsonPayload);
    } catch (e) { return null; }
};

const Settings = () => {
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [customRole, setCustomRole] = useState('');
    
    // משתנה שיחזיק את המפתח הייחודי לשמירה (למשל: user_prefs_64b5f...)
    const [storageKey, setStorageKey] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem('userToken') || localStorage.getItem('adminToken');
        if (token) {
            const user = parseJwt(token);
            if (user && (user._id || user.id)) {
                // יצירת מפתח ייחודי למשתמש הזה בלבד
                const key = `user_prefs_${user._id || user.id}`;
                setStorageKey(key);

                // ניסיון לטעון נתונים קיימים מהמפתח הספציפי הזה
                const savedData = localStorage.getItem(key);
                if (savedData) {
                    const parsed = JSON.parse(savedData);
                    setFirstName(parsed.firstName || '');
                    setLastName(parsed.lastName || '');
                    setCustomRole(parsed.customRole || '');
                }
            }
        }
    }, []);

    const handleSave = () => {
        if (!storageKey) return alert("שגיאה: לא ניתן לזהות משתמש לשמירה");

        // יצירת אובייקט עם כל הנתונים
        const dataToSave = {
            firstName,
            lastName,
            customRole
        };

        // שמירה תחת המפתח הייחודי של המשתמש
        localStorage.setItem(storageKey, JSON.stringify(dataToSave));
        
        alert('הפרטים נשמרו בהצלחה לפרופיל שלך!');
        window.location.reload(); 
    };

    return (
        <div className="p-8 text-white max-w-2xl mx-auto animate-fade-in-up">
            <h1 className="text-3xl font-bold mb-2">הגדרות מערכת</h1>
            <p className="text-gray-400 mb-8">עדכון פרטים אישיים (נשמרים מקומית עבורך).</p>

            <div className="bg-[#162b4d] p-6 rounded-2xl mb-6 shadow-xl border border-[#1f3c73]">
                <h2 className="text-xl font-semibold mb-4 text-cyan-400">👤 פרטים אישיים</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                        <label className="block mb-2 text-sm text-gray-300">שם פרטי</label>
                        <input 
                            type="text" 
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            className="w-full p-3 rounded-lg bg-[#0e1a2b] text-white focus:outline-none focus:border-cyan-500 border border-[#1f3c73] transition"
                        />
                    </div>
                    <div>
                        <label className="block mb-2 text-sm text-gray-300">שם משפחה</label>
                        <input 
                            type="text" 
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            className="w-full p-3 rounded-lg bg-[#0e1a2b] text-white focus:outline-none focus:border-cyan-500 border border-[#1f3c73] transition"
                        />
                    </div>
                </div>

                <div className="mb-2">
                    <label className="block mb-2 text-sm text-gray-300">תפקיד / דרגה (טקסט חופשי)</label>
                    <input 
                        type="text" 
                        value={customRole}
                        onChange={(e) => setCustomRole(e.target.value)}
                        placeholder='למשל: מפקד יחידה / מפקד גף / ממ"ח / ר"צ / טכנאי'
                        className="w-full p-3 rounded-lg bg-[#0e1a2b] text-white focus:outline-none focus:border-cyan-500 border border-[#1f3c73] transition"
                    />
                </div>
            </div>

            <button 
                onClick={handleSave}
                className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 px-8 rounded-lg shadow-lg transition transform hover:scale-105"
            >
                שמור פרטים אישיים
            </button>
        </div>
    );
};

export default Settings;