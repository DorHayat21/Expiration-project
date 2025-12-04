import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { FaTrash, FaSearch, FaExclamationTriangle, FaCheckCircle, FaTimesCircle, FaBoxOpen, FaFilter, FaLayerGroup, FaTags } from 'react-icons/fa';

// --- מבנה ארגוני (גף -> מחלקה) ---
const ORG_STRUCTURE = {
    'אלקטרואופטיקה': ['מסק"ר', 'מאו"ר', 'מרכז לייזר', 'חווטות וסיבים'],
    'הגנה אווירית': ['מערכות הגנ"א', 'מבדקים', 'שכבה תחתונה', 'TRMC'],
    'נשק מונחה': ['הנדסת ניסויים ותאלמ"ג', 'אוויר - קרקע', 'אוויר - אוויר'],
    'לות"ם': ['מחסן מרכזי', 'מצ"מ', 'שליטה']
};

// מילון תרגום תחומים
const DOMAIN_TRANSLATIONS = {
    'SAFETY': 'בטיחות',
    'DRIVING': 'נהיגה',
    'LAB': 'מעבדה',
    'LOGISTICS': 'לוגיסטיקה',
    'QUALITY': 'איכות',
};

// מילון תרגום נושאים
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

const Items = () => {
    // --- State Management ---
    const [assets, setAssets] = useState([]);
    const [catalogItems, setCatalogItems] = useState([]); // נתונים מלאים מהקטלוג
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // --- פילטרים ---
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    
    // פילטרים ארגוניים
    const [gafFilter, setGafFilter] = useState('ALL');
    const [deptFilter, setDeptFilter] = useState('ALL');

    // פילטרים קטלוגיים
    const [domainFilter, setDomainFilter] = useState('ALL');
    const [topicFilter, setTopicFilter] = useState('ALL');

    // טעינת נתונים (פריטים + קטלוג מלא)
    const fetchData = async () => {
        const token = localStorage.getItem('userToken') || localStorage.getItem('adminToken');
        if (!token) return window.location.href = '/login';
        
        try {
            setIsLoading(true);
            const config = { headers: { Authorization: `Bearer ${token}` } };
            
            // טעינה במקביל של פריטים וקטלוג
            const [assetsRes, catalogRes] = await Promise.all([
                axios.get('http://localhost:5000/api/assets', config),
                axios.get('http://localhost:5000/api/catalog', config)
            ]);

            setAssets(assetsRes.data);
            setCatalogItems(catalogRes.data);
        } catch (err) { 
            setError('שגיאה בטעינת נתונים'); 
            console.error(err);
        } finally { 
            setIsLoading(false); 
        }
    };

    const handleDelete = async (assetId) => {
        if (!window.confirm("למחוק את הפריט?")) return;
        const token = localStorage.getItem('userToken') || localStorage.getItem('adminToken');
        try {
            await axios.delete(`http://localhost:5000/api/assets/${assetId}`, { headers: { Authorization: `Bearer ${token}` } });
            fetchData(); // רענון נתונים
        } catch (err) { 
            alert("שגיאה במחיקה: " + (err.response?.data?.message || err.message)); 
        }
    };

    useEffect(() => { fetchData(); }, []); 

    // --- בניית מבנה הקטלוג לסינון ---
    const catalogStructure = useMemo(() => {
        const structure = {};
        catalogItems.forEach(item => {
            if (!structure[item.domain]) {
                structure[item.domain] = [];
            }
            if (!structure[item.domain].includes(item.topic)) {
                structure[item.domain].push(item.topic);
            }
        });
        return structure;
    }, [catalogItems]);

    // --- לוגיקת סטטוס ---
    const getStatusInfo = (expiryDate, totalDuration = 365) => {
        const diff = new Date(expiryDate) - new Date();
        const days = Math.ceil(diff / (1000 * 3600 * 24));
        const alertThreshold = totalDuration <= 30 ? 3 : 7; 

        if (days <= 0) return { bg: 'bg-red-500/20 text-red-300 border-red-500/50', icon: <FaTimesCircle/>, text: 'פג תוקף', statusKey: 'EXPIRED', days };
        if (days <= alertThreshold) return { bg: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50', icon: <FaExclamationTriangle/>, text: 'עומד לפוג', statusKey: 'EXPIRING_SOON', days };
        return { bg: 'bg-green-500/20 text-green-300 border-green-500/50', icon: <FaCheckCircle/>, text: 'תקף', statusKey: 'VALID', days }; 
    };

    // --- טיפול בשינוי פילטרים ---
    const handleGafFilterChange = (e) => {
        setGafFilter(e.target.value);
        setDeptFilter('ALL'); 
    };

    const handleDomainFilterChange = (e) => {
        setDomainFilter(e.target.value);
        setTopicFilter('ALL'); // איפוס נושא כשמשנים תחום
    };

    // --- סינון פריטים משולב ---
    const filteredAssets = assets.filter(asset => {
        if (!asset.catalogId || !asset.assignedTo) return false;
        
        const status = getStatusInfo(asset.expirationDate, asset.catalogId?.defaultExpirationDays);
        
        // תרגום לשמות בעברית לטובת החיפוש
        const hebrewTopic = TOPIC_TRANSLATIONS[asset.catalogId?.topic] || '';
        const hebrewDomain = DOMAIN_TRANSLATIONS[asset.catalogId?.domain] || '';

        // יצירת מחרוזת לחיפוש חופשי
        const searchStr = `${asset.companyAssetId} ${asset.catalogId?.topic} ${hebrewTopic} ${hebrewDomain} ${asset.gaf || ''} ${asset.department || ''} ${asset.assignedTo?.email}`.toLowerCase();
        
        // בדיקת פילטרים
        if (statusFilter !== 'ALL' && status.statusKey !== statusFilter) return false;
        if (gafFilter !== 'ALL' && asset.gaf !== gafFilter) return false;
        if (deptFilter !== 'ALL' && asset.department !== deptFilter) return false;
        if (domainFilter !== 'ALL' && asset.catalogId?.domain !== domainFilter) return false;
        if (topicFilter !== 'ALL' && asset.catalogId?.topic !== topicFilter) return false;
        
        if (searchTerm && !searchStr.includes(searchTerm.toLowerCase())) return false;
        
        return true;
    });

    return (
        <div className="animate-fade-in-up pb-10">
            
            {/* כותרת ראשית */}
            <div className="mb-6">
                <h2 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                    <span className="bg-cyan-500/20 p-2 rounded-lg text-cyan-400"><FaBoxOpen/></span>
                    מאגר פריטים
                </h2>
                <p className="text-gray-400 text-sm">ניהול ומעקב ציוד בזמן אמת (סה"כ: {assets.length})</p>
            </div>

            {/* --- סרגל כלים ופילטרים --- */}
            <div className="bg-[#102542] p-4 rounded-xl border border-[#1f3c73] shadow-lg mb-6 flex flex-col gap-4">
                
                {/* שורה עליונה: חיפוש וסטטוס */}
                <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
                    <div className="relative w-full md:w-96">
                        <FaSearch className="absolute right-3 top-3 text-gray-500"/>
                        <input 
                            type="text" placeholder="חיפוש חופשי (שם, מס' חוליה, תחום...)" value={searchTerm} onChange={e=>setSearchTerm(e.target.value)}
                            className="bg-[#0e1a2b] text-white pr-9 pl-4 py-2.5 rounded-lg border border-[#1f3c73] focus:border-cyan-500 outline-none w-full transition-all focus:shadow-[0_0_10px_rgba(6,182,212,0.3)]"
                        />
                    </div>

                    <select 
                        value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}
                        className="bg-[#0e1a2b] text-white px-4 py-2.5 rounded-lg border border-[#1f3c73] focus:border-cyan-500 outline-none cursor-pointer hover:bg-[#162b4d] transition w-full md:w-auto"
                    >
                        <option value="ALL">כל הסטטוסים</option>
                        <option value="EXPIRING_SOON">⚠️ קרוב לפוג</option>
                        <option value="EXPIRED">❌ פג תוקף</option>
                        <option value="VALID">✅ תקין</option>
                    </select>
                </div>

                {/* קו מפריד עדין */}
                <div className="border-t border-[#1f3c73]/50"></div>

                {/* שורה תחתונה: פילטרים מתקדמים */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    
                    {/* 1. פילטר תחום */}
                    <div className="relative group">
                        <FaLayerGroup className="absolute right-3 top-3 text-purple-500/50 group-hover:text-purple-400 transition"/>
                        <select 
                            value={domainFilter} onChange={handleDomainFilterChange}
                            className="bg-[#0e1a2b] text-white pr-9 pl-4 py-2 rounded-lg border border-[#1f3c73] focus:border-purple-500 outline-none cursor-pointer hover:bg-[#162b4d] transition w-full appearance-none"
                        >
                            <option value="ALL">כל התחומים</option>
                            {Object.keys(catalogStructure).map(domain => (
                                <option key={domain} value={domain}>{DOMAIN_TRANSLATIONS[domain] || domain}</option>
                            ))}
                        </select>
                    </div>

                    {/* 2. פילטר נושא */}
                    <div className="relative group">
                        <FaTags className={`absolute right-3 top-3 transition ${domainFilter === 'ALL' ? 'text-gray-600' : 'text-purple-500/50 group-hover:text-purple-400'}`}/>
                        <select 
                            value={topicFilter} onChange={e => setTopicFilter(e.target.value)}
                            disabled={domainFilter === 'ALL'}
                            className={`bg-[#0e1a2b] text-white pr-9 pl-4 py-2 rounded-lg border border-[#1f3c73] focus:border-purple-500 outline-none w-full appearance-none transition
                                ${domainFilter === 'ALL' ? 'opacity-50 cursor-not-allowed text-gray-500' : 'cursor-pointer hover:bg-[#162b4d]'}`}
                        >
                            <option value="ALL">כל הנושאים</option>
                            {domainFilter !== 'ALL' && catalogStructure[domainFilter]?.map(topic => (
                                <option key={topic} value={topic}>{TOPIC_TRANSLATIONS[topic] || topic}</option>
                            ))}
                        </select>
                    </div>

                    {/* 3. פילטר גף */}
                    <div className="relative group">
                        <FaFilter className="absolute right-3 top-3 text-cyan-500/50 group-hover:text-cyan-400 transition"/>
                        <select 
                            value={gafFilter} onChange={handleGafFilterChange}
                            className="bg-[#0e1a2b] text-white pr-9 pl-4 py-2 rounded-lg border border-[#1f3c73] focus:border-cyan-500 outline-none cursor-pointer hover:bg-[#162b4d] transition w-full appearance-none"
                        >
                            <option value="ALL">כל הגפים</option>
                            {Object.keys(ORG_STRUCTURE).map(gaf => (
                                <option key={gaf} value={gaf}>{gaf}</option>
                            ))}
                        </select>
                    </div>

                    {/* 4. פילטר מחלקה */}
                    <div className="relative group">
                        <FaFilter className={`absolute right-3 top-3 transition ${gafFilter === 'ALL' ? 'text-gray-600' : 'text-cyan-500/50 group-hover:text-cyan-400'}`}/>
                        <select 
                            value={deptFilter} onChange={e => setDeptFilter(e.target.value)}
                            disabled={gafFilter === 'ALL'}
                            className={`bg-[#0e1a2b] text-white pr-9 pl-4 py-2 rounded-lg border border-[#1f3c73] focus:border-cyan-500 outline-none w-full appearance-none transition
                                ${gafFilter === 'ALL' ? 'opacity-50 cursor-not-allowed text-gray-500' : 'cursor-pointer hover:bg-[#162b4d]'}`}
                        >
                            <option value="ALL">כל המחלקות</option>
                            {gafFilter !== 'ALL' && ORG_STRUCTURE[gafFilter].map(dept => (
                                <option key={dept} value={dept}>{dept}</option>
                            ))}
                        </select>
                    </div>

                </div>
            </div>

            {/* --- טבלה --- */}
            <div className="bg-[#162b4d]/80 backdrop-blur-xl rounded-2xl border border-[#1f3c73] shadow-2xl overflow-hidden overflow-x-auto">
                <table className="w-full text-right border-collapse min-w-[1000px]">
                    <thead className="bg-[#0e1a2b]/90 text-gray-400 text-xs uppercase font-bold tracking-wider">
                        <tr>
                            <th className="p-4 w-[160px]">סטטוס</th>
                            <th className="p-4">נושא</th>
                            <th className="p-4">מס"ד</th>
                            
                            <th className="p-4">גף</th>
                            <th className="p-4">מחלקה</th>
                            
                            <th className="p-4 text-center">נוהל (ימים)</th>
                            <th className="p-4">תוקף</th>
                            <th className="p-4 text-center">ימים</th>
                            <th className="p-4">אחראי</th>
                            <th className="p-4 text-center">פעולות</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1f3c73] text-sm text-gray-300">
                        {isLoading ? (
                            <tr><td colSpan="10" className="p-12 text-center text-cyan-400 animate-pulse">טוען נתונים...</td></tr>
                        ) : error ? (
                            <tr><td colSpan="10" className="p-12 text-center text-red-400">{error}</td></tr>
                        ) : filteredAssets.length === 0 ? (
                            <tr><td colSpan="10" className="p-12 text-center text-gray-500">לא נמצאו פריטים התואמים את הסינון.</td></tr>
                        ) : (
                            filteredAssets.map(asset => {
                                const status = getStatusInfo(asset.expirationDate, asset.catalogId.defaultExpirationDays);
                                return (
                                    <tr key={asset._id} className="hover:bg-[#1f3c73]/40 transition duration-200">
                                        <td className="p-4">
                                            <span className={`flex items-center gap-2 px-3 py-1 rounded-full border ${status.bg} text-xs font-bold w-fit shadow-sm`}>
                                                {status.icon} {status.text}
                                            </span>
                                        </td>
                                        <td className="p-4 font-medium text-white text-base">
                                            {TOPIC_TRANSLATIONS[asset.catalogId.topic] || asset.catalogId.topic}
                                            <div className="text-[10px] text-gray-400 font-normal mt-0.5">
                                                {DOMAIN_TRANSLATIONS[asset.catalogId.domain] || asset.catalogId.domain}
                                            </div>
                                        </td>
                                        <td className="p-4 font-mono text-cyan-200">{asset.companyAssetId}</td>
                                        
                                        <td className="p-4 text-white font-medium">{asset.gaf}</td>
                                        <td className="p-4 text-gray-300">{asset.department}</td>
                                        
                                        <td className="p-4 text-center opacity-70">{asset.catalogId.defaultExpirationDays}</td>
                                        <td className="p-4 font-bold">{new Date(asset.expirationDate).toLocaleDateString('he-IL')}</td>
                                        
                                        {/* --- התיקון כאן: הוספת dir="ltr" סביב המספר --- */}
                                        <td className="p-4 text-center font-mono text-lg">
                                            <span dir="ltr">{status.days}</span>
                                        </td>
                                        
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
        </div>
    );
};

export default Items;