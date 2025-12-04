import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaPlus, FaLayerGroup, FaExclamationTriangle, FaTimesCircle, FaCheckCircle, FaChartPie } from 'react-icons/fa';
import NewAssetModal from '../components/NewAssetModal';

// רכיב כרטיס מעוצב ומודרני
const DashboardCard = ({ title, value, color, icon, subColor }) => (
    <div className={`relative overflow-hidden bg-slate-800/60 backdrop-blur-md p-6 rounded-2xl border border-slate-700 shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 group`}>
        {/* קישוט רקע */}
        <div className={`absolute -right-6 -top-6 text-9xl opacity-5 ${subColor} group-hover:scale-110 transition-transform duration-500`}>
            {icon}
        </div>
        
        <div className="relative z-10 flex flex-col h-full justify-between">
            <div className="flex items-center gap-3 mb-2">
                <div className={`p-2 rounded-lg ${color} bg-opacity-20 text-white shadow-inner`}>
                    {icon}
                </div>
                <h3 className="text-slate-300 font-medium text-sm tracking-wide">{title}</h3>
            </div>
            <p className="text-4xl font-extrabold text-white mt-1 font-mono tracking-tight">{value}</p>
        </div>
        
        {/* פס צבע תחתון */}
        <div className={`absolute bottom-0 left-0 h-1 w-full ${color} opacity-70`}></div>
    </div>
);

const Home = () => {
    // --- מצבי נתונים ---
    const [assets, setAssets] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showModal, setShowModal] = useState(false);

    // --- Fetch Logic ---
    const fetchAssets = async () => {
        const token = localStorage.getItem('userToken') || localStorage.getItem('adminToken');
        if (!token) { return window.location.href = '/login'; }

        try {
            setIsLoading(true);
            const response = await axios.get('http://localhost:5000/api/assets', { headers: { Authorization: `Bearer ${token}` } });
            setAssets(response.data); 
        } catch (err) {
            setError('לא הצלחנו לטעון את הנתונים.');
            console.error(err);
            if (err.response?.status === 401) window.location.href = '/login';
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { fetchAssets(); }, []); 

    // --- חישובים (מתוקן ומסונכרן עם הטבלה) ---
    let expiredCount = 0;
    let expiringSoonCount = 0;

    assets.forEach(asset => {
        // חישוב הימים שנותרו (בדיוק כמו בטבלה)
        const diff = new Date(asset.expirationDate) - new Date();
        const days = Math.ceil(diff / (1000 * 3600 * 24));
        
        // שליפת אורך החיים של הפריט (ברירת מחדל 365 אם אין)
        const totalDuration = asset.catalogId?.defaultExpirationDays || 365;
        
        // קביעת הסף הדינמי: 3 ימים לפריטים קצרים, 7 ימים לפריטים ארוכים
        const threshold = totalDuration <= 30 ? 3 : 7;

        if (days <= 0) {
            expiredCount++;
        } else if (days <= threshold) {
            expiringSoonCount++;
        }
    });

    const totalAssets = assets.length;
    const validCount = totalAssets - expiredCount - expiringSoonCount;

    // --- רינדור ---
    return (
        <div className="animate-fade-in-up">
            
            {/* כותרת וכפתור פעולה */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-6">
                <div>
                    <h1 className="text-4xl font-extrabold text-white mb-2 flex items-center gap-3">
                        <span className="text-cyan-400"><FaChartPie/></span> לוח בקרה
                    </h1>
                    <p className="text-slate-400 text-lg">סקירה כללית של פריטים ותוקף</p>
                </div>

                <button 
                    onClick={() => setShowModal(true)} 
                    className="flex items-center gap-2 py-3 px-6 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white rounded-full font-bold shadow-lg shadow-blue-500/30 transition-all transform hover:-translate-y-1"
                >
                    <FaPlus /> יצירת פריט חדש
                </button>
            </div>

            {/* איזור טעינה / שגיאה */}
            {isLoading ? (
                <div className="text-center py-20 text-cyan-400 text-xl animate-pulse">טוען נתונים מהמערכת...</div>
            ) : error ? (
                <div className="text-center py-20 text-red-400 bg-red-900/20 rounded-xl border border-red-900/50">{error}</div>
            ) : (
                <>
                    {/* --- כרטיסי המידע --- */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <DashboardCard 
                            title="סך הכל פריטים" 
                            value={totalAssets} 
                            color="bg-blue-500" 
                            subColor="text-blue-500"
                            icon={<FaLayerGroup/>} 
                        />
                        <DashboardCard 
                            title="פגי תוקף (קריטי)" 
                            value={expiredCount} 
                            color="bg-red-500" 
                            subColor="text-red-500"
                            icon={<FaTimesCircle/>} 
                        />
                        <DashboardCard 
                            title="עומדים לפוג בקרוב" 
                            value={expiringSoonCount} 
                            color="bg-yellow-500" 
                            subColor="text-yellow-500"
                            icon={<FaExclamationTriangle/>} 
                        />
                        <DashboardCard 
                            title="תקינים לשימוש" 
                            value={validCount} 
                            color="bg-emerald-500" 
                            subColor="text-emerald-500"
                            icon={<FaCheckCircle/>} 
                        />
                    </div>

                    {/* אזור סיכום תחתון */}
                    <div className="p-8 bg-slate-800/40 backdrop-blur-sm rounded-2xl border border-slate-700/50 text-center">
                        <h2 className="text-xl font-semibold text-slate-200 mb-2">💡 ניהול מתקדם</h2>
                        <p className="text-slate-400">
                            לצפייה בפירוט המלא, סינון לפי מחלקות וייצוא דוחות - עבור לעמוד <span className="text-cyan-400 font-bold cursor-pointer hover:underline" onClick={() => window.location.href='/items'}>רשימת הפריטים</span>.
                        </p>
                    </div>
                </>
            )}

            {/* מודל יצירת פריט */}
            {showModal && (
                <NewAssetModal 
                    onClose={() => setShowModal(false)}
                    onAssetCreated={() => { 
                        setShowModal(false); 
                        fetchAssets(); 
                    }}
                />
            )}
        </div>
    );
};

export default Home;