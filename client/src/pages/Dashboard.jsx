import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { FaChartPie, FaFilter, FaLayerGroup, FaTags, FaSync, FaChartBar, FaLock } from 'react-icons/fa'; 
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
// ייבוא הקבועים
import { ORG_STRUCTURE, DOMAIN_TRANSLATIONS, TOPIC_TRANSLATIONS, COLORS } from '../constants';

// פונקציית עזר לפענוח הטוקן
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

const Dashboard = () => {
    // --- State Management ---
    const [assets, setAssets] = useState([]);
    const [catalogItems, setCatalogItems] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // --- פילטרים ---
    const [gafFilter, setGafFilter] = useState('ALL');
    const [deptFilter, setDeptFilter] = useState('ALL');
    const [domainFilter, setDomainFilter] = useState('ALL');
    const [topicFilter, setTopicFilter] = useState('ALL');

    // --- ניהול הרשאות (נעילת פילטרים) ---
    const [isGafLocked, setIsGafLocked] = useState(false);
    const [isDeptLocked, setIsDeptLocked] = useState(false);

    // 1. זיהוי משתמש והגדרת הרשאות
    useEffect(() => {
        const token = localStorage.getItem('userToken') || localStorage.getItem('adminToken');
        if (token) {
            const user = parseJwt(token);
            if (user) {
                if (user.role === 'User') {
                    if (user.gaf) {
                        setGafFilter(user.gaf);
                        setIsGafLocked(true);
                    }
                    if (user.department) {
                        setDeptFilter(user.department);
                        setIsDeptLocked(true);
                    }
                }
                else if (user.role === 'SuperViewer') {
                      if (!user.gaf || user.gaf === '') {
                        setIsGafLocked(false);
                        setIsDeptLocked(false);
                      } else {
                        setGafFilter(user.gaf);
                        setIsGafLocked(true);
                      }
                }
            }
        }
    }, []);

    // טעינת נתונים
    const fetchData = async () => {
        const token = localStorage.getItem('userToken') || localStorage.getItem('adminToken');
        if (!token) return window.location.href = '/login';
        
        try {
            setIsLoading(true);
            const config = { headers: { Authorization: `Bearer ${token}` } };
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

    useEffect(() => { fetchData(); }, []);

    // חישוב מבנה קטלוג לסינון
    const catalogStructure = useMemo(() => {
        const structure = {};
        catalogItems.forEach(item => {
            if (!structure[item.domain]) structure[item.domain] = [];
            if (!structure[item.domain].includes(item.topic)) structure[item.domain].push(item.topic);
        });
        return structure;
    }, [catalogItems]);

    // לוגיקת סטטוס
    const getStatusInfo = (expiryDate, totalDuration = 365) => {
        const diff = new Date(expiryDate) - new Date();
        const days = Math.ceil(diff / (1000 * 3600 * 24));
        const alertThreshold = totalDuration <= 30 ? 3 : 7;
        if (days <= 0) return { statusKey: 'EXPIRED', label: 'פג תוקף' };
        if (days <= alertThreshold) return { statusKey: 'EXPIRING_SOON', label: 'עומד לפוג' };
        return { statusKey: 'VALID', label: 'תקין' };
    };

    // --- סינון הנתונים לגרפים ---
    const filteredData = useMemo(() => {
        return assets.filter(asset => {
            if (!asset.catalogId) return false;
            if (gafFilter !== 'ALL' && asset.gaf !== gafFilter) return false;
            if (deptFilter !== 'ALL' && asset.department !== deptFilter) return false;
            if (domainFilter !== 'ALL' && asset.catalogId.domain !== domainFilter) return false;
            if (topicFilter !== 'ALL' && asset.catalogId.topic !== topicFilter) return false;
            return true;
        });
    }, [assets, gafFilter, deptFilter, domainFilter, topicFilter]);

    // --- הכנת נתונים לגרפים ---

    // 1. נתונים לגרף עוגה (סטטוסים)
    const pieData = useMemo(() => {
        const counts = { VALID: 0, EXPIRING_SOON: 0, EXPIRED: 0 };
        filteredData.forEach(asset => {
            const { statusKey } = getStatusInfo(asset.expirationDate, asset.catalogId.defaultExpirationDays);
            counts[statusKey]++;
        });
        return [
            { name: 'תקין', value: counts.VALID, color: COLORS.VALID },
            { name: 'עומד לפוג', value: counts.EXPIRING_SOON, color: COLORS.EXPIRING_SOON },
            { name: 'פג תוקף', value: counts.EXPIRED, color: COLORS.EXPIRED },
        ].filter(d => d.value > 0);
    }, [filteredData]);

    // 2. נתונים לגרף עמודות
    const barData = useMemo(() => {
        const gafCounts = {};
        
        filteredData.forEach(asset => {
            const { statusKey } = getStatusInfo(asset.expirationDate, asset.catalogId.defaultExpirationDays);
            const gaf = asset.gaf || 'כללי';
            
            if (!gafCounts[gaf]) gafCounts[gaf] = { name: gaf, expired: 0, expiring: 0, valid: 0 };
            
            if (statusKey === 'EXPIRED') gafCounts[gaf].expired++;
            else if (statusKey === 'EXPIRING_SOON') gafCounts[gaf].expiring++;
            else gafCounts[gaf].valid++;
        });

        return Object.values(gafCounts)
            .sort((a, b) => (b.expired + b.expiring + b.valid) - (a.expired + a.expiring + a.valid));
    }, [filteredData]);

    // --- Custom Tooltip ---
    // --- Custom Tooltip ---
    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            const total = payload.reduce((sum, entry) => sum + entry.value, 0);
            return (
                <div className="bg-[#0e1a2b] border border-[#1f3c73] p-3 rounded-lg shadow-xl text-right dir-rtl">
                    <p className="font-bold text-white mb-2 underline decoration-cyan-500 underline-offset-4">{label}</p>
                    {payload.map((entry, index) => (
                        // השינוי הוא כאן: הורדתי את style={{ color: entry.color }} והוספתי text-white
                        <p key={index} className="text-sm font-medium flex items-center gap-2 justify-end text-white">
                            <span className="text-gray-400 text-xs">({((entry.value / total) * 100).toFixed(0)}%)</span>
                            <span>{entry.value}</span> :<span>{entry.name}</span>
                            {/* אופציונלי: אם אתה רוצה ריבוע צבעוני קטן ליד הטקסט הלבן כדי שעדיין ידעו מה הצבע */}
                            <span style={{ width: 10, height: 10, backgroundColor: entry.color, display: 'inline-block', borderRadius: '50%' }}></span>
                        </p>
                    ))}
                    <div className="border-t border-gray-600/50 mt-2 pt-1 text-xs text-gray-400 text-center">
                        סה"כ: {total} פריטים
                    </div>
                </div>
            );
        }
        return null;
    };

    // --- Handlers ---
    const handleGafFilterChange = (e) => { setGafFilter(e.target.value); setDeptFilter('ALL'); };
    const handleDomainFilterChange = (e) => { setDomainFilter(e.target.value); setTopicFilter('ALL'); };

    if (isLoading) return <div className="text-center text-cyan-400 mt-20 text-xl animate-pulse">טוען נתונים גרפיים...</div>;

    return (
        <div className="animate-fade-in-up pb-10 px-2 md:px-0">
            
            {/* כותרת */}
            <div className="mb-6 flex justify-between items-end">
                <div>
                    <h2 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                        <span className="bg-purple-500/20 p-2 rounded-lg text-purple-400"><FaChartPie/></span>
                        תצוגה גרפית ומדדים
                    </h2>
                    <p className="text-gray-400 text-sm">מבט על: {filteredData.length} פריטים מוצגים</p>
                </div>
                <button onClick={fetchData} className="text-cyan-400 hover:bg-cyan-900/30 p-2 rounded-full transition"><FaSync/></button>
            </div>

            {/* --- סרגל פילטרים --- */}
            <div className="bg-[#102542] p-4 rounded-xl border border-[#1f3c73] shadow-lg mb-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    
                    {/* בחירת תחום */}
                    <div className="relative group">
                        <FaLayerGroup className="absolute right-3 top-3 text-purple-500/50"/>
                        <select value={domainFilter} onChange={handleDomainFilterChange} className="bg-[#0e1a2b] text-white pr-9 pl-4 py-2 rounded-lg border border-[#1f3c73] focus:border-purple-500 outline-none w-full appearance-none cursor-pointer">
                            <option value="ALL">כל התחומים</option>
                            {Object.keys(catalogStructure).map(d => <option key={d} value={d}>{DOMAIN_TRANSLATIONS[d] || d}</option>)}
                        </select>
                    </div>

                    {/* בחירת נושא */}
                    <div className="relative group">
                        <FaTags className="absolute right-3 top-3 text-purple-500/50"/>
                        <select value={topicFilter} onChange={e=>setTopicFilter(e.target.value)} disabled={domainFilter==='ALL'} className={`bg-[#0e1a2b] text-white pr-9 pl-4 py-2 rounded-lg border border-[#1f3c73] outline-none w-full appearance-none ${domainFilter==='ALL'?'opacity-50':'cursor-pointer'}`}>
                            <option value="ALL">כל הנושאים</option>
                            {domainFilter !== 'ALL' && catalogStructure[domainFilter]?.map(t => <option key={t} value={t}>{TOPIC_TRANSLATIONS[t] || t}</option>)}
                        </select>
                    </div>

                    {/* בחירת גף */}
                    <div className="relative group">
                        {isGafLocked ? <FaLock className="absolute right-3 top-3 text-red-500/70"/> : <FaFilter className="absolute right-3 top-3 text-cyan-500/50"/>}
                        <select 
                            value={gafFilter} 
                            onChange={handleGafFilterChange} 
                            disabled={isGafLocked}
                            className={`bg-[#0e1a2b] text-white pr-9 pl-4 py-2 rounded-lg border border-[#1f3c73] outline-none w-full appearance-none ${isGafLocked ? 'opacity-60 cursor-not-allowed border-red-900/30' : 'cursor-pointer focus:border-cyan-500'}`}
                        >
                            <option value="ALL">כל הגפים</option>
                            {Object.keys(ORG_STRUCTURE).map(g => <option key={g} value={g}>{g}</option>)}
                        </select>
                    </div>

                    {/* בחירת מחלקה */}
                    <div className="relative group">
                        {isDeptLocked ? <FaLock className="absolute right-3 top-3 text-red-500/70"/> : <FaFilter className="absolute right-3 top-3 text-cyan-500/50"/>}
                        <select 
                            value={deptFilter} 
                            onChange={e=>setDeptFilter(e.target.value)} 
                            disabled={gafFilter==='ALL' || isDeptLocked} 
                            className={`bg-[#0e1a2b] text-white pr-9 pl-4 py-2 rounded-lg border border-[#1f3c73] outline-none w-full appearance-none ${gafFilter==='ALL' || isDeptLocked ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                        >
                            <option value="ALL">כל המחלקות</option>
                            {gafFilter !== 'ALL' && ORG_STRUCTURE[gafFilter]?.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                    </div>

                </div>
            </div>

            {/* --- אזור הגרפים --- */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* גרף 1: עמודות גפים */}
                <div className="bg-[#162b4d]/80 backdrop-blur-xl p-6 rounded-2xl border border-[#1f3c73] shadow-xl">
                    <h3 className="text-xl font-bold text-gray-200 mb-4 border-b border-gray-600/30 pb-2 w-full flex items-center gap-2">
                        <FaChartBar className="text-cyan-400"/>
                        התפלגות תקינות לפי גף (יחסי)
                    </h3>
                    <div className="w-full h-[300px]" style={{ height: 300 }}>
                        {barData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%" debounce={300}>
                                <BarChart
                                    data={barData}
                                    layout="vertical"
                                    stackOffset="expand"
                                    margin={{ top: 20, right: 30, left: 0, bottom: 5 }} 
                                >
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#1f3c73" opacity={0.5} />
                                    {/* ציר X הובהר */}
                                    <XAxis 
                                        type="number" 
                                        stroke="#cbd5e1" // צבע קו בהיר יותר
                                        tick={{ fill: '#cbd5e1', fontSize: 11 }} // צבע טקסט בהיר
                                        tickFormatter={(tick) => `${(tick * 100).toFixed(0)}%`} 
                                    />
                                    <YAxis 
                                        dataKey="name" 
                                        type="category" 
                                        width={150} 
                                        stroke="#ffffff" 
                                        tick={{ fill: '#ffffff', fontWeight: 'bold', fontSize: 13, textAnchor: 'end', dx: -100 }} 
                                        tickLine={false} 
                                        axisLine={false} 
                                    />
                                    <Tooltip content={<CustomTooltip />} cursor={{fill: '#0d113eff', opacity: 0.4}} />
                                    {/* מקרא עם טקסט לבן */}
                                    <Legend 
                                        verticalAlign="top" 
                                        align="right" 
                                        wrapperStyle={{paddingBottom: '10px', color: '#e2e8f0'}} 
                                    />
                                    <Bar dataKey="valid" name="תקין" stackId="a" fill={COLORS.VALID} />
                                    <Bar dataKey="expiring" name="עומד לפוג" stackId="a" fill={COLORS.EXPIRING_SOON} />
                                    <Bar dataKey="expired" name="פג תוקף" stackId="a" fill={COLORS.EXPIRED} radius={[0, 4, 4, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            // צבע טקסט "אין נתונים" הובהר
                            <div className="h-full flex items-center justify-center text-gray-300">אין נתונים להצגה</div>
                        )}
                    </div>
                </div>

                {/* גרף 2: פאי סטטוסים */}
                <div className="bg-[#162b4d]/80 backdrop-blur-xl p-6 rounded-2xl border border-[#1f3c73] shadow-xl flex flex-col items-center">
                    <h3 className="text-xl font-bold text-gray-200 mb-4 border-b border-gray-600/30 pb-2 w-full text-center">סטטוס כללי (לפי בחירה)</h3>
                    <div className="w-full h-[300px]" style={{ height: 300 }}>
                        {pieData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%" debounce={300}>
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={100}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                                        ))}
                                    </Pie>
                                    <Tooltip content={<CustomTooltip />} />
                                    {/* מקרא עם טקסט לבן */}
                                    <Legend 
                                        verticalAlign="bottom" 
                                        height={36} 
                                        wrapperStyle={{ color: '#fdfdfdff' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                             // צבע טקסט "אין נתונים" הובהר
                            <div className="h-full flex items-center justify-center text-gray-300">אין נתונים להצגה</div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default Dashboard;