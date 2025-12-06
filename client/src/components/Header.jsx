import React, { useState, useEffect } from 'react';

const parseJwt = (token) => {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
        return JSON.parse(jsonPayload);
    } catch (e) { return null; }
};

const Header = () => {
    const [displayName, setDisplayName] = useState('');
    const [customRole, setCustomRole] = useState('');
    const [systemRoleHebrew, setSystemRoleHebrew] = useState('משתמש');
    const [rawSystemRole, setRawSystemRole] = useState('User');

    useEffect(() => {
        const token = localStorage.getItem('userToken') || localStorage.getItem('adminToken');
        
        // נתוני ברירת מחדל
        let fName = '';
        let lName = '';
        let cRole = '';
        let sysRole = 'User';

        if (token) {
            const user = parseJwt(token);
            if (user) {
                sysRole = user.role;
                
                // --- הטריק החדש: טעינה לפי מזהה משתמש ---
                const key = `user_prefs_${user._id || user.id}`;
                const savedData = localStorage.getItem(key);
                
                if (savedData) {
                    const parsed = JSON.parse(savedData);
                    fName = parsed.firstName;
                    lName = parsed.lastName;
                    cRole = parsed.customRole;
                }
            }
        }

        // הגדרת נתונים לתצוגה
        const full = `${fName || ''} ${lName || ''}`.trim();
        setDisplayName(full);
        setCustomRole(cRole || '');
        setRawSystemRole(sysRole);

        if (sysRole === 'Admin') setSystemRoleHebrew('מנהל מערכת');
        else if (sysRole === 'SuperViewer') setSystemRoleHebrew('צופה על');
        else setSystemRoleHebrew('משתמש');

    }, []);

    const getRoleBadgeColor = (role) => {
        switch (role) {
            case 'Admin': return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
            case 'SuperViewer': return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
            default: return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30';
        }
    };

    return (
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 bg-[#162b4d] p-4 rounded-xl shadow-lg text-white border border-[#1f3c73]">
            <div className="flex items-center gap-4 mb-4 md:mb-0">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-full flex items-center justify-center border-2 border-white/10 shadow-lg relative">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span className="absolute bottom-1 right-0 w-3 h-3 bg-green-400 border-2 border-[#162b4d] rounded-full"></span>
                </div>
                
                <div className="flex flex-col items-start">
                    <span className="font-bold text-xl tracking-wide text-white mb-1">
                        {displayName || systemRoleHebrew}
                    </span>
                    <div className="flex items-center gap-2 text-sm">
                        {customRole && (
                            <>
                                <span className="text-gray-300">{customRole}</span>
                                <span className="text-gray-600">|</span>
                            </>
                        )}
                        <span className={`px-2 py-0.5 rounded-md text-xs font-medium border ${getRoleBadgeColor(rawSystemRole)}`}>
                            {systemRoleHebrew}
                        </span>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-4 bg-white/5 p-2 rounded-lg backdrop-blur-sm border border-white/10">
                 <img src="/assets/IAF_New_Logo_2018.png" alt="IAF" className="h-10 object-contain drop-shadow-md hover:scale-110 transition-transform duration-300" />
                 <div className="w-px h-8 bg-gray-500/50"></div>
                 <img src="/assets/tech-wing.png" alt="Tech" className="h-10 object-contain drop-shadow-md hover:scale-110 transition-transform duration-300" />
                 <img src="/assets/Bamza_108.png" alt="Unit" className="h-10 object-contain drop-shadow-md hover:scale-110 transition-transform duration-300" />
                 <img src="/assets/Matnam_5656.png" alt="Matnam" className="h-10 object-contain drop-shadow-md hover:scale-110 transition-transform duration-300" />
            </div>
        </div>
    );
};

export default Header;