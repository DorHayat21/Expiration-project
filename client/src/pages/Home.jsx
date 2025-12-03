import React, { useState, useEffect } from 'react';
import axios from 'axios';
import NewAssetModal from '../components/NewAssetModal';

// Simple reusable component for the dashboard cards
const DashboardCard = ({ title, value, color }) => (
    <div className={`${color} p-6 rounded-xl shadow-lg`}>
        <h3 className="text-lg font-medium opacity-80">{title}</h3>
        <p className="text-4xl font-extrabold mt-2">{value}</p>
    </div>
);


const Home = () => {
    // Component States
    const [assets, setAssets] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showModal, setShowModal] = useState(false); // State for modal visibility

    // Function to fetch assets (defined outside useEffect so it can be called later)
    const fetchAssets = async () => {
        // Retrieve token from local storage (must have logged in previously)
        const token = localStorage.getItem('userToken') || localStorage.getItem('adminToken');
        
        if (!token) {
            // If no token, redirect to login page
            return window.location.href = '/login'; 
        }

        try {
            setIsLoading(true);
            const config = {
                headers: { Authorization: `Bearer ${token}` },
            };
            
            const response = await axios.get('/api/assets', config);
            
            setAssets(response.data); // Store the fetched asset list
        } catch (err) {
            setError('Failed to fetch assets. Check console for details.');
            console.error(err);
            if (err.response?.status === 401) {
                window.location.href = '/login';
            }
        } finally {
            setIsLoading(false);
        }
    };

    // Run fetchAssets only ONCE when component mounts
    useEffect(() => {
        fetchAssets();
    }, []); 

    // --- Data Calculation for Dashboard Cards ---
    const totalAssets = assets.length;
    const expiredCount = assets.filter(a => new Date(a.expirationDate) < new Date()).length;
    const expiringSoonCount = assets.filter(a => {
        const expiryDate = new Date(a.expirationDate);
        const sevenDays = new Date();
        sevenDays.setDate(sevenDays.getDate() + 7);
        return expiryDate > new Date() && expiryDate <= sevenDays;
    }).length;

    // --- Conditional Rendering ---
    if (isLoading) {
        return <div className="text-white pt-10 text-xl">טוען נתונים...</div>;
    }

    if (error) {
        return <div className="text-red-500 pt-10 text-xl">{error}</div>;
    }

    return (
        <div className="p-4">
            
            {/* Button to open the creation modal */}
            <button 
                onClick={() => setShowModal(true)} 
                className="mb-6 py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 transition duration-200"
            >
                + יצירת פריט חדש
            </button>
            
            {/* Main Hebrew Title */}
            <h1 className="text-3xl font-bold text-white mb-6">לוח בקרה - פגי תוקף</h1> 
            
            {/* --- DASHBOARD CARDS --- */}
            <div className="grid grid-cols-4 gap-6">
                <DashboardCard title="סך הכל פריטים" value={totalAssets} color="bg-blue-600" />
                <DashboardCard title="פריטים פגי תוקף" value={expiredCount} color="bg-red-600" />
                <DashboardCard title="עומדים לפוג (7 ימים)" value={expiringSoonCount} color="bg-yellow-600" />
                <DashboardCard title="מוכנים לחידוש" value={totalAssets - expiredCount} color="bg-green-600" />
            </div>

            {/* General Summary (Replaced Dark Mode Footer) */}
            <div className="mt-8 p-6 bg-[#162b4d] rounded-xl text-white">
                <h2 className="text-2xl font-semibold mb-4">נתוני סיכום כלליים</h2>
                <p>הצגת נתונים מלאים הועברה לעמוד 'פריטים'.</p>
            </div>
            
            {/* Modal Component - only shows if showModal is true */}
            {showModal && (
                <NewAssetModal 
                    onClose={() => setShowModal(false)}
                    onAssetCreated={() => { 
                        // After successful creation, close modal and reload data from API
                        setShowModal(false); 
                        fetchAssets(); 
                    }}
                />
            )}
        </div>
    );
};

export default Home;