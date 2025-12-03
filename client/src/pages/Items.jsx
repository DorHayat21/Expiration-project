import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaTrash, FaSearch, FaFilter, FaExclamationTriangle, FaCheckCircle, FaTimesCircle, FaBoxOpen } from 'react-icons/fa';
import MainLayout from '../MainLayout';

// המילון שלך נשמר
const TOPIC_TRANSLATIONS = {
    'Car Service': 'טיפול רכב', 'Driving License': 'רישיון נהיגה', 'Regulators': 'ווסטים', 'Private Warehouse': 'מחסן פרטי', 'Tool Cabinet': 'ארון כלים', 'Accessory Bags': 'תיקי אביזר', 'RCD': 'מפסק פחת', 'Soldering Station': 'עמדת הלחמה', 'ESD Station': 'עמדת ESD', 'Hazmat Cabinet': 'ארון חומ"ס', 'Extinguishers': 'מטפים',
};

const Items = () => {
    // --- אותה לוגיקה בדיוק ---
    const [assets, setAssets] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');

    const fetchAssets = async () => {
        const token = localStorage.getItem('userToken') || localStorage.getItem('adminToken');
        if (!token) return window.location.href = '/login';
        try {
            setIsLoading(true);
            const res = await axios.get('/api/assets', { headers: { Authorization: `Bearer ${token}` } });
            setAssets(res.data); 
        } catch (err) { setError('שגיאה בטעינת נתונים'); } finally { setIsLoading(false); }
    };

    const handleDelete = async (assetId) => {
        if (!window.confirm("למחוק את הפריט?")) return;
        const token = localStorage.getItem('userToken') || localStorage.getItem('adminToken');
        try {
            await axios.delete(`/api/assets/${assetId}`, { headers: { Authorization: `Bearer ${token}` } });
            fetchAssets(); 
        } catch (err) { alert("שגיאה במחיקה: " + (err.response?.data?.message || err.message)); }
    };

    useEffect(() => { fetchAssets(); }, []); 

    // עיצוב הסטטוסים עודכן ל"תגים" יפים
    const getStatusInfo = (expiryDate) => {
        const diff = new Date(expiryDate) - new Date();
        const days = Math.ceil(diff / (1000 * 3600 * 24));
        
        if (days <= 0) return { bg: 'bg-red-500/20 text-red-300 border-red-500/50', icon: <FaTimesCircle/>, text: 'פג תוקף', statusKey: 'EXPIRED', days };
        if (days <= 30) return { bg: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50', icon: <FaExclamationTriangle/>, text: 'עומד לפוג', statusKey: 'EXPIRING_SOON', days };
        return { bg: 'bg-green-500/20 text-green-300 border-green-500/50', icon: <FaCheckCircle/>, text: 'תקף', statusKey: 'VALID', days }; 
    };

    const filteredAssets = assets.filter(asset => {
        if (!asset.catalogId || !asset.assignedTo) return false;
        const status = getStatusInfo(asset.expirationDate);
        const searchStr = `${asset.companyAssetId} ${asset.catalogId?.topic} ${asset.department} ${asset.assignedTo?.email}`.toLowerCase();
        
        if (statusFilter !== 'ALL' && status.statusKey !== statusFilter) return false;
        if (searchTerm && !searchStr.includes(searchTerm.toLowerCase())) return false;
        return true;
    });

    // --- ה-HTML החדש (העיצוב) ---
    return (
        <MainLayout>
            
            {/* כותרת ופילטרים */}
            <div className="flex flex-col md:flex-row justify-between items-end mb-6 gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                        <span className="bg-cyan-500/20 p-2 rounded-lg text-cyan-400"><FaBoxOpen/></span>
                        מאגר פריטים
                    </h2>
                    <p className="text-gray-400 text-sm">ניהול ומעקב ציוד בזמן אמת (סה"כ: {assets.length})</p>
                </div>

                <div className="flex gap-3 bg-[#102542] p-1.5 rounded-lg border border-[#1f3c73] shadow-lg">
                    <div className="relative">
                        <FaSearch className="absolute right-3 top-3 text-gray-500"/>
                        <input 
                            type="text" placeholder="חיפוש חופשי..." value={searchTerm} onChange={e=>setSearchTerm(e.target.value)}
                            className="bg-[#0e1a2b] text-white pr-9 pl-4 py-2 rounded-md border border-[#1f3c73] focus:border-cyan-500 outline-none w-48 focus:w-64 transition-all"
                        />
                    </div>
                    <select 
                        value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}
                        className="bg-[#0e1a2b] text-white px-4 py-2 rounded-md border border-[#1f3c73] focus:border-cyan-500 outline-none cursor-pointer"
                    >
                        <option value="ALL">הכל</option>
                        <option value="EXPIRING_SOON">⚠️ קרוב</option>
                        <option value="EXPIRED">❌ פג תוקף</option>
                    </select>
                </div>
            </div>

            {/* הטבלה החדשה */}
            <div className="bg-[#162b4d]/80 backdrop-blur-xl rounded-2xl border border-[#1f3c73] shadow-2xl overflow-hidden">
                <table className="w-full text-right border-collapse">
                    <thead className="bg-[#0e1a2b]/90 text-gray-400 text-xs uppercase font-bold tracking-wider">
                        <tr>
                            <th className="p-4 w-[160px]">סטטוס</th>
                            <th className="p-4">נושא</th>
                            <th className="p-4">מסח"א</th>
                            <th className="p-4">מחלקה</th>
                            <th className="p-4 text-center">נוהל (ימים)</th>
                            <th className="p-4">פג תוקף</th>
                            <th className="p-4 text-center">ימים</th>
                            <th className="p-4">אחראי</th>
                            <th className="p-4 text-center">פעולות</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1f3c73] text-sm text-gray-300">
                        {isLoading ? (
                            <tr><td colSpan="9" className="p-12 text-center text-cyan-400 animate-pulse">טוען נתונים...</td></tr>
                        ) : error ? (
                            <tr><td colSpan="9" className="p-12 text-center text-red-400">{error}</td></tr>
                        ) : filteredAssets.length === 0 ? (
                            <tr><td colSpan="9" className="p-12 text-center text-gray-500">לא נמצאו פריטים.</td></tr>
                        ) : (
                            filteredAssets.map(asset => {
                                const status = getStatusInfo(asset.expirationDate);
                                return (
                                    <tr key={asset._id} className="hover:bg-[#1f3c73]/40 transition duration-200">
                                        <td className="p-4">
                                            <span className={`flex items-center gap-2 px-3 py-1 rounded-full border ${status.bg} text-xs font-bold w-fit shadow-sm`}>
                                                {status.icon} {status.text}
                                            </span>
                                        </td>
                                        <td className="p-4 font-medium text-white text-base">
                                            {TOPIC_TRANSLATIONS[asset.catalogId.topic] || asset.catalogId.topic}
                                        </td>
                                        <td className="p-4 font-mono text-cyan-200">{asset.companyAssetId}</td>
                                        <td className="p-4">{asset.department}</td>
                                        <td className="p-4 text-center opacity-70">{asset.catalogId.defaultExpirationDays}</td>
                                        <td className="p-4 font-bold">{new Date(asset.expirationDate).toLocaleDateString('he-IL')}</td>
                                        <td className="p-4 text-center font-mono text-lg">{status.days}</td>
                                        <td className="p-4 text-xs text-gray-400">{asset.assignedTo.email}</td>
                                        <td className="p-4 text-center">
                                            <button 
                                                onClick={() => handleDelete(asset._id)} 
                                                className="text-gray-400 hover:text-red-400 hover:bg-red-500/10 p-2 rounded-full transition"
                                                title="מחק"
                                            >
                                                <FaTrash/>
                                            </button>
                                        </td>
                                    </tr>
                                )
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </MainLayout>
    );
};

export default Items;