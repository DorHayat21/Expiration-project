import React, { useState, useEffect } from 'react';
import axios from 'axios';

// *** הוסף את מילון התרגומים לראש הקובץ ***
const TOPIC_TRANSLATIONS = {
    'Car Service': 'טיפול רכב', 'Driving License': 'רישיון נהיגה', 'Regulators': 'ווסטים', 'Private Warehouse': 'מחסן פרטי', 'Tool Cabinet': 'ארון כלים', 'Accessory Bags': 'תיקי אביזר', 'RCD': 'מפסק פחת', 'Soldering Station': 'עמדת הלחמה', 'ESD Station': 'עמדת ESD', 'Hazmat Cabinet': 'ארון חומ"ס', 'Extinguishers': 'מטפים',
};

// -----------------------------------------------------------------------------

const EditAssetModal = ({ assetData, onClose, onAssetUpdated }) => {
    // State to hold the form data, initialized with the existing assetData
    const [formData, setFormData] = useState({
        companyAssetId: assetData.companyAssetId || '',
        serialNumber: assetData.serialNumber || '',
        catalogId: assetData.catalogId?._id || '', 
        lastInspectionDate: assetData.lastInspectionDate ? new Date(assetData.lastInspectionDate).toISOString().split('T')[0] : '', 
        department: assetData.department || '',
        squadNumber: assetData.squadNumber || '',
    });
    
    const [catalogRules, setCatalogRules] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    // Fetch Catalog Rules on component mount
    useEffect(() => {
        const fetchRules = async () => {
            const token = localStorage.getItem('userToken') || localStorage.getItem('adminToken');
            const config = { headers: { Authorization: `Bearer ${token}` } };
            
            try {
                const res = await axios.get('/api/catalog', config);
                setCatalogRules(res.data);

            } catch (err) {
                setError('Failed to fetch catalog rules.');
                console.error("Error fetching catalog rules:", err);
            }
        };

        fetchRules();
    }, []);


    // Handle input changes
    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // Handle form submission (PUT request)
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        const token = localStorage.getItem('userToken') || localStorage.getItem('adminToken');
        
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            
            await axios.put(`/api/assets/${assetData._id}`, formData, config);
            
            onAssetUpdated();
            
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update asset. Check permissions.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    // *** פונקציה לתרגום הדומיין (SAFETY/QUALITY) ***
    const translateDomain = (domain) => {
        if (domain === 'SAFETY') return 'בטיחות';
        if (domain === 'QUALITY') return 'איכות';
        if (domain === 'LOGISTICS') return 'לוגיסטיקה';
        if (domain === 'LAB') return 'מעבדה';
        if (domain === 'DRIVING') return 'נהיגה';
        return domain; // Fallback
    };


    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-[#102542] p-6 rounded-xl shadow-2xl w-full max-w-lg text-white text-right relative">
                
                <h2 className="text-2xl font-bold mb-4 border-b pb-2 border-gray-600">עריכת פריט: {assetData.companyAssetId}</h2>
                
                {error && <div className="bg-red-700 p-3 rounded mb-4 text-center">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-4">
                    
                    {/* Catalog Rule Selection (Dropdown) - הקוד ששונה: */}
                    <div className="flex flex-col">
                        <label htmlFor="catalogId" className="mb-1 text-sm text-gray-400">כלל קטלוג / תחום</label>
                        <select
                            id="catalogId"
                            name="catalogId"
                            value={formData.catalogId}
                            onChange={handleChange}
                            required
                            className="p-2 bg-[#162b4d] border border-gray-600 rounded text-white focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="" disabled>בחר כלל קטלוג...</option>
                            {catalogRules.map(rule => (
                                <option key={rule._id} value={rule._id}>
                                    {/* *** שימוש בפונקציית התרגום החדשה *** */}
                                    {`${translateDomain(rule.domain)}: ${TOPIC_TRANSLATIONS[rule.topic] || rule.topic} (${rule.defaultExpirationDays} ימים)`}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Company Asset ID (Read-only for existing assets) */}
                    <div className="flex flex-col">
                        <label htmlFor="companyAssetId" className="mb-1 text-sm text-gray-400">מספר נכס (מסח"א)</label>
                        <input
                            type="text"
                            id="companyAssetId"
                            name="companyAssetId"
                            value={formData.companyAssetId}
                            readOnly 
                            className="p-2 bg-gray-500 border border-gray-400 rounded cursor-not-allowed" 
                        />
                    </div>
                    
                    {/* Serial Number */}
                    <div className="flex flex-col">
                        <label htmlFor="serialNumber" className="mb-1 text-sm text-gray-400">מספר סידורי</label>
                        <input
                            type="text"
                            id="serialNumber"
                            name="serialNumber"
                            value={formData.serialNumber}
                            onChange={handleChange}
                            className="p-2 bg-[#162b4d] border border-gray-600 rounded"
                        />
                    </div>

                    {/* Last Inspection Date */}
                    <div className="flex flex-col">
                        <label htmlFor="lastInspectionDate" className="mb-1 text-sm text-gray-400">תאריך בדיקה אחרונה (קובע תוקף)</label>
                        <input
                            type="date"
                            id="lastInspectionDate"
                            name="lastInspectionDate"
                            value={formData.lastInspectionDate}
                            onChange={handleChange}
                            required
                            className="p-2 bg-[#162b4d] border border-gray-600 rounded"
                        />
                    </div>

                    {/* Department */}
                    <div className="flex flex-col">
                        <label htmlFor="department" className="mb-1 text-sm text-gray-400">מחלקה</label>
                        <input
                            type="text"
                            id="department"
                            name="department"
                            value={formData.department}
                            onChange={handleChange}
                            required
                            className="p-2 bg-[#162b4d] border border-gray-600 rounded"
                        />
                    </div>

                    {/* Squad Number */}
                    <div className="flex flex-col">
                        <label htmlFor="squadNumber" className="mb-1 text-sm text-gray-400">מספר צוות</label>
                        <input
                            type="text"
                            id="squadNumber"
                            name="squadNumber"
                            value={formData.squadNumber}
                            onChange={handleChange}
                            className="p-2 bg-[#162b4d] border border-gray-600 rounded"
                        />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-between pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="py-2 px-4 bg-gray-600 text-white rounded hover:bg-gray-700 transition duration-200"
                            disabled={isLoading}
                        >
                            ביטול
                        </button>
                        <button
                            type="submit"
                            className="py-2 px-4 bg-green-600 text-white rounded hover:bg-green-700 transition duration-200 disabled:opacity-50"
                            disabled={isLoading}
                        >
                            {isLoading ? 'מעדכן...' : 'שמירת עדכון'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditAssetModal;