import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaHome, FaClipboardList, FaScroll, FaChartPie, FaCog, FaSignOutAlt } from 'react-icons/fa'; 

const navItems = [
    { name: 'דף הבית', path: '/', icon: <FaHome /> },
    { name: 'פריטים', path: '/items', icon: <FaClipboardList /> },
    { name: 'כללים', path: '/rules', icon: <FaScroll /> },
    { name: 'תצוגה גרפית', path: '/dashboard', icon: <FaChartPie /> }, 
    { name: 'הגדרות', path: '/settings', icon: <FaCog /> },
];

const Sidebar = () => {
    const location = useLocation();

    const handleLogout = () => {
        // שואלים את המשתמש אם הוא בטוח
        if (window.confirm("האם אתה בטוח שברצונך להתנתק?")) {
            
            // 1. מחיקת נתוני התחברות (מה שהיה לך קודם)
            localStorage.removeItem('userToken');
            localStorage.removeItem('adminToken');
            localStorage.removeItem('userRole');

            // 2. --- התיקון: מחיקת פרטים אישיים כדי שלא יעברו למשתמש הבא ---
            localStorage.removeItem('firstName');
            localStorage.removeItem('lastName');
            localStorage.removeItem('username'); // ליתר ביטחון
            localStorage.removeItem('customRole');

            // 3. מעבר לדף התחברות
            window.location.href = '/login';
        }
    };

    return (
        <div className="fixed top-0 right-0 h-full w-64 bg-[#102542] border-l border-[#1f3c73] text-white shadow-2xl z-20 flex flex-col">
            
            {/* 1. לוגו וכותרת */}
            <div className="flex flex-col items-center pt-8 pb-6 border-b border-gray-600/50 mx-4">
                <h1 className="text-2xl font-extrabold tracking-wider text-cyan-400 drop-shadow-md">
                    ExpiryTrack
                </h1>
                <p className="text-xs mt-1 text-gray-400">פרויקט פגי תוקף 2026</p>
            </div>

            {/* 2. תפריט ניווט */}
            <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
                {navItems.map((item) => (
                    <Link
                        key={item.name}
                        to={item.path}
                        className={`flex items-center p-3 rounded-lg text-sm transition-all duration-200 group
                            ${location.pathname === item.path 
                                ? 'bg-gradient-to-r from-[#1b3c66] to-[#254e85] text-white font-bold shadow-lg border-r-4 border-cyan-400' 
                                : 'text-gray-300 hover:bg-[#1f3c73]/50 hover:text-white'
                            }`}
                    >
                        <span className="ml-3 text-lg group-hover:scale-110 transition-transform">{item.icon}</span>
                        <span>{item.name}</span>
                    </Link>
                ))}
            </nav>

            {/* 3. כפתור התנתקות */}
            <div className="p-4 border-t border-gray-600/50 bg-[#0d1f38]">
                <button 
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center p-3 rounded-lg text-sm font-bold text-red-200 bg-red-900/20 hover:bg-red-900/40 border border-red-900/50 transition-all duration-200 shadow-inner"
                >
                    <span className="ml-2"><FaSignOutAlt /></span>
                    <span>התנתקות</span>
                </button>
            </div>
        </div>
    );
};

export default Sidebar;