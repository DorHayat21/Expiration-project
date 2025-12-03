import React from 'react'; // Retained for compiler compatibility
import { Link, useLocation } from 'react-router-dom';

// Define navigation items with Hebrew names and paths
const navItems = [
    { name: 'דף הבית', path: '/', icon: '🏠' },
    { name: 'פריטים', path: '/items', icon: '📝' },
    { name: 'כללים', path: '/catalog', icon: '📜' },
    { name: 'התראות', path: '/alerts', icon: '⚠️' },
    { name: 'הגדרות', path: '/settings', icon: '⚙️' },
];

const Sidebar = () => {
    const location = useLocation();

    // Logic to handle logout: remove token and redirect to login
    const handleLogout = () => {
        // Remove both user and admin tokens to ensure full log out
        localStorage.removeItem('userToken');
        localStorage.removeItem('adminToken');
        // Redirect to the public login page
        window.location.href = '/login';
    };

    return (
        // CRITICAL: Fixed positioning, dark background, and z-index to be on top
        <div className="fixed top-0 right-0 h-full w-56 bg-[#102542] border-l border-[#1f3c73] p-4 text-white shadow-2xl z-10">
            
            {/* Logo and Project Name Placeholder */}
            <div className="flex flex-col items-center pb-6 border-b border-gray-600/50">
                <h1 className="text-xl font-extrabold tracking-wider text-cyan-400">
                    ExpiryTrack
                </h1>
                <p className="text-xs mt-1 text-gray-400">פרויקט פגי תוקף 2026</p>
            </div>

            {/* Navigation Links (map iterates over the defined array) */}
            <nav className="mt-8 space-y-2">
                {navItems.map((item) => (
                    <Link
                        key={item.name}
                        to={item.path}
                        // Styling the active link based on current path
                        className={`flex items-center p-3 rounded-lg text-sm transition-colors duration-200 
                            ${location.pathname === item.path 
                                ? 'bg-[#1b3c66] text-white font-semibold' 
                                : 'text-gray-300 hover:bg-[#1f3c73] hover:text-white'
                            }`}
                    >
                        <span className="ml-3 text-lg">{item.icon}</span>
                        <span>{item.name}</span>
                    </Link>
                ))}
            </nav>

            {/* Logout Button (Fixed at the bottom) */}
            <div className="absolute bottom-4 w-full pr-8">
                <button 
                    onClick={handleLogout}
                    className="w-full flex items-center p-3 rounded-lg text-sm text-gray-300 bg-red-800/10 hover:bg-red-800/30 transition-colors duration-200"
                >
                    <span className="ml-3">🚪</span>
                    <span>התנתקות</span>
                </button>
            </div>
        </div>
    );
};

export default Sidebar;