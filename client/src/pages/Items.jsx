import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import ExcelJS from 'exceljs'; 
import { saveAs } from 'file-saver'; 
import { FaTrash, FaEdit, FaSearch, FaExclamationTriangle, FaCheckCircle, FaTimesCircle, FaBoxOpen, FaFilter, FaLayerGroup, FaTags, FaLock, FaFileExcel, FaCalendarAlt, FaSave, FaTimes } from 'react-icons/fa';
import { ORG_STRUCTURE, DOMAIN_TRANSLATIONS, TOPIC_TRANSLATIONS } from '../constants';

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

const Items = () => {
    // --- State Management ---
    const [assets, setAssets] = useState([]);
    const [catalogItems, setCatalogItems] = useState([]); 
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // ניהול הרשאות
    const [canDelete, setCanDelete] = useState(false);
    const [canEdit, setCanEdit] = useState(false); // הרשאה חדשה לעריכה

    // --- ניהול ה-Modal (חלון קופץ) ---
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingAsset, setEditingAsset] = useState(null);
    const [newInspectionDate, setNewInspectionDate] = useState('');

    // --- פילטרים ---
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [gafFilter, setGafFilter] = useState('ALL');
    const [deptFilter, setDeptFilter] = useState('ALL');
    const [isGafLocked, setIsGafLocked] = useState(false);
    const [isDeptLocked, setIsDeptLocked] = useState(false);
    const [domainFilter, setDomainFilter] = useState('ALL');
    const [topicFilter, setTopicFilter] = useState('ALL');

    const fetchData = async () => {
        const token = localStorage.getItem('userToken') || localStorage.getItem('adminToken');
        if (!token) return window.location.href = '/login';
        
        const user = parseJwt(token);
        
        if (user) {
            // הגדרת הרשאות עריכה ומחיקה
            // מפקד גף (SuperViewer) לא יכול למחוק, אבל בוא נחליט שהוא כן יכול לחדש תוקף (תגיד לי אם לשנות)
            // משתמש רגיל יכול הכל על הציוד שלו
            if (user.role === 'SuperViewer') {
                setCanDelete(false);
                setCanEdit(false); // לרוב מפקד גף רק צופה, אם תרצה שהוא יערוך תשנה ל-true
            } else {
                setCanDelete(true);
                setCanEdit(true);
            }

            if (user.role === 'User') {
                if (user.gaf) { setGafFilter(user.gaf); setIsGafLocked(true); }
                if (user.department) { setDeptFilter(user.department); setIsDeptLocked(true); }
            } else if (user.role === 'SuperViewer') {
                if (!user.gaf || user.gaf === '') {
                    setIsGafLocked(false); setIsDeptLocked(false); setGafFilter('ALL');
                } else {
                    setGafFilter(user.gaf); setIsGafLocked(true); setIsDeptLocked(false);
                }
            }
        }

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

    // --- פונקציות עריכה וחידוש ---
    const openRenewModal = (asset) => {
        setEditingAsset(asset);
        // ברירת מחדל: התאריך של היום
        setNewInspectionDate(new Date().toISOString().split('T')[0]);
        setIsEditModalOpen(true);
    };

    const handleRenewSubmit = async () => {
        if (!newInspectionDate) return alert("נא לבחור תאריך בדיקה");
        
        const token = localStorage.getItem('userToken') || localStorage.getItem('adminToken');
        try {
            // שליחת בקשת עדכון לשרת
            await axios.put(`http://localhost:5000/api/assets/${editingAsset._id}`, {
                lastInspectionDate: newInspectionDate
                // השרת כבר יחשב לבד את ה-expirationDate החדש בגלל הלוגיקה שבנינו ב-Controller
            }, { headers: { Authorization: `Bearer ${token}` } });

            alert("הפריט חודש בהצלחה!");
            setIsEditModalOpen(false);
            setEditingAsset(null);
            fetchData(); // רענון הטבלה
        } catch (err) {
            alert("שגיאה בחידוש הפריט: " + (err.response?.data?.message || err.message));
        }
    };

    const handleDelete = async (assetId) => {
        if (!canDelete) return; 
        if (!window.confirm("למחוק את הפריט?")) return;
        const token = localStorage.getItem('userToken') || localStorage.getItem('adminToken');
        try {
            await axios.delete(`http://localhost:5000/api/assets/${assetId}`, { headers: { Authorization: `Bearer ${token}` } });
            fetchData(); 
        } catch (err) { 
            alert("שגיאה במחיקה: " + (err.response?.data?.message || err.message)); 
        }
    };

    useEffect(() => { fetchData(); }, []); 

    const catalogStructure = useMemo(() => {
        const structure = {};
        catalogItems.forEach(item => {
            if (!structure[item.domain]) structure[item.domain] = [];
            if (!structure[item.domain].includes(item.topic)) structure[item.domain].push(item.topic);
        });
        return structure;
    }, [catalogItems]);

    const getStatusInfo = (expiryDate, totalDuration = 365) => {
        const diff = new Date(expiryDate) - new Date();
        const days = Math.ceil(diff / (1000 * 3600 * 24));
        const alertThreshold = totalDuration <= 30 ? 3 : 7; 

        if (days <= 0) return { bg: 'bg-red-500/20 text-red-300 border-red-500/50', icon: <FaTimesCircle/>, text: 'פג תוקף', statusKey: 'EXPIRED', days };
        if (days <= alertThreshold) return { bg: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50', icon: <FaExclamationTriangle/>, text: 'עומד לפוג', statusKey: 'EXPIRING_SOON', days };
        return { bg: 'bg-green-500/20 text-green-300 border-green-500/50', icon: <FaCheckCircle/>, text: 'תקף', statusKey: 'VALID', days }; 
    };

    const handleGafFilterChange = (e) => { setGafFilter(e.target.value); setDeptFilter('ALL'); };
    const handleDomainFilterChange = (e) => { setDomainFilter(e.target.value); setTopicFilter('ALL'); };

    const filteredAssets = assets.filter(asset => {
        if (!asset.catalogId || !asset.assignedTo) return false;
        
        const status = getStatusInfo(asset.expirationDate, asset.catalogId?.defaultExpirationDays);
        const hebrewTopic = TOPIC_TRANSLATIONS[asset.catalogId?.topic] || '';
        const hebrewDomain = DOMAIN_TRANSLATIONS[asset.catalogId?.domain] || '';
        const searchStr = `${asset.companyAssetId} ${asset.catalogId?.topic} ${hebrewTopic} ${hebrewDomain} ${asset.gaf || ''} ${asset.department || ''} ${asset.assignedTo?.email}`.toLowerCase();
        
        if (statusFilter !== 'ALL' && status.statusKey !== statusFilter) return false;
        if (gafFilter !== 'ALL' && asset.gaf !== gafFilter) return false;
        if (deptFilter !== 'ALL' && asset.department !== deptFilter) return false;
        if (domainFilter !== 'ALL' && asset.catalogId?.domain !== domainFilter) return false;
        if (topicFilter !== 'ALL' && asset.catalogId?.topic !== topicFilter) return false;
        if (searchTerm && !searchStr.includes(searchTerm.toLowerCase())) return false;
        
        return true;
    });

    const handleExport = async () => {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('דוח פריטים', { views: [{rightToLeft: true}] });
        worksheet.columns = [
            { header: 'נושא', key: 'topic', width: 20 },
            { header: 'תחום', key: 'domain', width: 15 },
            { header: 'מס"ד', key: 'assetId', width: 15 },
            { header: 'גף', key: 'gaf', width: 15 },
            { header: 'מחלקה', key: 'department', width: 15 },
            { header: 'סטטוס', key: 'status', width: 15 },
            { header: 'תאריך תפוגה', key: 'expiryDate', width: 15 },
            { header: 'ימים נותרו', key: 'daysLeft', width: 12 },
            { header: 'אחראי', key: 'assignedTo', width: 25 },
        ];
        const headerRow = worksheet.getRow(1);
        headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 12 };
        headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF102542' } };
        headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

        filteredAssets.forEach(asset => {
            const status = getStatusInfo(asset.expirationDate, asset.catalogId.defaultExpirationDays);
            const row = worksheet.addRow({
                topic: TOPIC_TRANSLATIONS[asset.catalogId.topic] || asset.catalogId.topic,
                domain: DOMAIN_TRANSLATIONS[asset.catalogId.domain] || asset.catalogId.domain,
                assetId: asset.companyAssetId,
                gaf: asset.gaf,
                department: asset.department,
                status: status.text,
                expiryDate: new Date(asset.expirationDate).toLocaleDateString('he-IL'),
                daysLeft: status.days,
                assignedTo: asset.assignedTo.email
            });
            row.eachCell((cell) => {
                cell.alignment = { vertical: 'middle', horizontal: 'center' };
                cell.border = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} };
            });
            if (status.statusKey === 'EXPIRED') {
                row.eachCell((cell) => { cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFCCCC' } }; cell.font = { color: { argb: 'FF990000' }, bold: true }; });
            } else if (status.statusKey === 'EXPIRING_SOON') {
                row.eachCell((cell) => { cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFCC' } }; });
            }
        });
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        saveAs(blob, `ExpiryTrack_Report_${new Date().toLocaleDateString('he-IL').replace(/\./g, '-')}.xlsx`);
    };

    return (
        <div className="animate-fade-in-up pb-10 relative">
            
            {/* --- Modal לחידוש תוקף --- */}
            {isEditModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
                    <div className="bg-[#102542] w-full max-w-md rounded-2xl border border-[#1f3c73] shadow-2xl p-6 text-right dir-rtl animate-scale-in">
                        <div className="flex justify-between items-center mb-6 border-b border-[#1f3c73] pb-4">
                            <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                                <FaCalendarAlt className="text-cyan-400"/> חידוש תוקף
                            </h3>
                            <button onClick={() => setIsEditModalOpen(false)} className="text-gray-400 hover:text-white transition"><FaTimes size={20}/></button>
                        </div>
                        
                        <div className="space-y-4 mb-8">
                            <div className="bg-[#0e1a2b] p-4 rounded-lg border border-[#1f3c73]/50">
                                <p className="text-gray-400 text-sm">פריט:</p>
                                <p className="text-white font-bold text-lg">{TOPIC_TRANSLATIONS[editingAsset?.catalogId?.topic] || editingAsset?.catalogId?.topic}</p>
                                <p className="text-cyan-400 font-mono mt-1 text-sm">מס"ד: {editingAsset?.companyAssetId}</p>
                            </div>

                            <div>
                                <label className="block text-gray-300 text-sm mb-2">תאריך בדיקה חדש:</label>
                                <input 
                                    type="date" 
                                    value={newInspectionDate}
                                    onChange={(e) => setNewInspectionDate(e.target.value)}
                                    // הוספתי בסוף את: [color-scheme:dark]
                                    className="w-full bg-[#0e1a2b] text-white p-3 rounded-lg border border-[#1f3c73] focus:border-cyan-500 outline-none transition [color-scheme:dark]"
                                />
                                <p className="text-xs text-gray-500 mt-2">* התוקף החדש יחושב אוטומטית לפי סוג הפריט</p>
                                <p className="text-xs text-gray-500 mt-2">* שימו לב: פורמט התאריך (יום/חודש) מוצג בהתאם להגדרות המחשב שלכם.</p>
                            </div>
                        </div>

                        <div className="flex gap-3 justify-end">
                            <button onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 text-gray-300 hover:bg-[#1f3c73] rounded-lg transition">ביטול</button>
                            <button onClick={handleRenewSubmit} className="px-6 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-lg shadow-lg transition flex items-center gap-2">
                                <FaSave/> שמור וחדש
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                        <span className="bg-cyan-500/20 p-2 rounded-lg text-cyan-400"><FaBoxOpen/></span>
                        מאגר פריטים
                    </h2>
                    <p className="text-gray-400 text-sm">ניהול ומעקב ציוד בזמן אמת (סה"כ: {assets.length})</p>
                </div>
                <button onClick={handleExport} className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg shadow-lg transition transform hover:scale-105">
                    <FaFileExcel /> ייצוא לאקסל מעוצב
                </button>
            </div>

            <div className="bg-[#102542] p-4 rounded-xl border border-[#1f3c73] shadow-lg mb-6 flex flex-col gap-4">
                <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
                    <div className="relative w-full md:w-96">
                        <FaSearch className="absolute right-3 top-3 text-gray-500"/>
                        <input type="text" placeholder="חיפוש חופשי..." value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} className="bg-[#0e1a2b] text-white pr-9 pl-4 py-2.5 rounded-lg border border-[#1f3c73] focus:border-cyan-500 outline-none w-full transition-all focus:shadow-[0_0_10px_rgba(6,182,212,0.3)]"/>
                    </div>
                    <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)} className="bg-[#0e1a2b] text-white px-4 py-2.5 rounded-lg border border-[#1f3c73] focus:border-cyan-500 outline-none cursor-pointer hover:bg-[#162b4d] transition w-full md:w-auto">
                        <option value="ALL">כל הסטטוסים</option>
                        <option value="EXPIRING_SOON">⚠️ קרוב לפוג</option>
                        <option value="EXPIRED">❌ פג תוקף</option>
                        <option value="VALID">✅ תקין</option>
                    </select>
                </div>
                
                {/* --- פילטרים (קיצור קוד כי לא השתנה מהקודם) --- */}
                <div className="border-t border-[#1f3c73]/50"></div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="relative group">
                        <FaLayerGroup className="absolute right-3 top-3 text-purple-500/50"/>
                        <select value={domainFilter} onChange={handleDomainFilterChange} className="bg-[#0e1a2b] text-white pr-9 pl-4 py-2 rounded-lg border border-[#1f3c73] focus:border-purple-500 outline-none cursor-pointer w-full appearance-none">
                            <option value="ALL">כל התחומים</option>
                            {Object.keys(catalogStructure).map(domain => <option key={domain} value={domain}>{DOMAIN_TRANSLATIONS[domain] || domain}</option>)}
                        </select>
                    </div>
                    <div className="relative group">
                        <FaTags className={`absolute right-3 top-3 ${domainFilter === 'ALL' ? 'text-gray-600' : 'text-purple-500/50'}`}/>
                        <select value={topicFilter} onChange={e => setTopicFilter(e.target.value)} disabled={domainFilter === 'ALL'} className={`bg-[#0e1a2b] text-white pr-9 pl-4 py-2 rounded-lg border border-[#1f3c73] outline-none w-full appearance-none ${domainFilter === 'ALL' ? 'opacity-50' : 'cursor-pointer'}`}>
                            <option value="ALL">כל הנושאים</option>
                            {domainFilter !== 'ALL' && catalogStructure[domainFilter]?.map(t => <option key={t} value={t}>{TOPIC_TRANSLATIONS[t] || t}</option>)}
                        </select>
                    </div>
                    <div className="relative group">
                        {isGafLocked ? <FaLock className="absolute right-3 top-3 text-red-500/70" /> : <FaFilter className="absolute right-3 top-3 text-cyan-500/50"/>}
                        <select value={gafFilter} onChange={handleGafFilterChange} disabled={isGafLocked} className={`bg-[#0e1a2b] text-white pr-9 pl-4 py-2 rounded-lg border border-[#1f3c73] outline-none w-full appearance-none ${isGafLocked ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}>
                            <option value="ALL">כל הגפים</option>
                            {Object.keys(ORG_STRUCTURE).map(g => <option key={g} value={g}>{g}</option>)}
                        </select>
                    </div>
                    <div className="relative group">
                         {isDeptLocked ? <FaLock className="absolute right-3 top-3 text-red-500/70" /> : <FaFilter className="absolute right-3 top-3 text-cyan-500/50"/>}
                        <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)} disabled={gafFilter === 'ALL' || isDeptLocked} className={`bg-[#0e1a2b] text-white pr-9 pl-4 py-2 rounded-lg border border-[#1f3c73] outline-none w-full appearance-none ${gafFilter === 'ALL' || isDeptLocked ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}>
                            <option value="ALL">כל המחלקות</option>
                            {gafFilter !== 'ALL' && ORG_STRUCTURE[gafFilter].map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                    </div>
                </div>
            </div>

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
                            {(canDelete || canEdit) && <th className="p-4 text-center">פעולות</th>}
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
                                            <td className="p-4 text-center font-mono text-lg"><span dir="ltr">{status.days}</span></td>
                                            <td className="p-4 text-xs text-gray-400">{asset.assignedTo.email}</td>
                                            
                                            {(canDelete || canEdit) && (
                                                <td className="p-4 text-center flex justify-center gap-2">
                                                    {/* כפתור עריכה */}
                                                    {canEdit && (
                                                        <button 
                                                            onClick={() => openRenewModal(asset)} 
                                                            className="text-cyan-400 hover:text-white hover:bg-cyan-500/20 p-2 rounded-full transition" 
                                                            title="חדש תוקף"
                                                        >
                                                            <FaEdit/>
                                                        </button>
                                                    )}
                                                    
                                                    {/* כפתור מחיקה */}
                                                    {canDelete && (
                                                        <button 
                                                            onClick={() => handleDelete(asset._id)} 
                                                            className="text-gray-400 hover:text-red-400 hover:bg-red-500/10 p-2 rounded-full transition" 
                                                            title="מחק"
                                                        >
                                                            <FaTrash/>
                                                        </button>
                                                    )}
                                                </td>
                                            )}
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