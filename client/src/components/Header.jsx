import React, { useState, useEffect } from 'react';

const Header = () => {
    const [roleText, setRoleText] = useState('משתמש');
    const [userEmail, setUserEmail] = useState('');

    useEffect(() => {
        // 1. שליפת התפקיד ששמרנו ב-Login
        const role = localStorage.getItem('userRole');
        
        // 2. קביעת הטקסט להצגה לפי התפקיד
        if (role === 'Admin') {
            setRoleText('מנהל מערכת');
        } else if (role === 'SuperViewer') {
            setRoleText('צופה על'); // <-- התיקון שביקשת
        } else {
            setRoleText('משתמש');
        }

        // 3. (אופציונלי) שליפת האימייל מהטוקן או ממקום אחר אם שמרת, כרגע נשאיר ריק או סטטי
        // const email = localStorage.getItem('userEmail'); 
        // if (email) setUserEmail(email);
    }, []);

    return (
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 bg-[#162b4d] p-4 rounded-xl shadow-lg text-white border border-[#1f3c73]">
            
            {/* צד ימין: פרטי המשתמש המחובר */}
            <div className="flex items-center gap-4 mb-4 md:mb-0">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center border-2 border-white/20 shadow-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                </div>
                <div className="flex flex-col">
                    <span className="font-bold text-lg tracking-wide text-cyan-100">{roleText}</span>
                    <span className="text-xs text-gray-400">מחובר למערכת</span>
                </div>
            </div>

            {/* צד שמאל: לוגואים (כמו במסך ההתחברות) */}
            <div className="flex items-center gap-4 bg-white/5 p-2 rounded-lg backdrop-blur-sm border border-white/10">
                 <img src="/assets/IAF_New_Logo_2018.png" alt="IAF" className="h-10 object-contain drop-shadow-md" />
                 <div className="w-px h-8 bg-gray-500/50"></div> {/* קו מפריד */}
                 <img src="/assets/tech-wing.png" alt="Tech" className="h-10 object-contain drop-shadow-md" />
                 <img src="/assets/Bamza_108.png" alt="Unit" className="h-10 object-contain drop-shadow-md" />
                 <img src="/assets/Matnam_5656.png" alt="Matnam" className="h-10 object-contain drop-shadow-md hover:scale-110 transition-transform" />
            </div>
        </div>
    );
};

export default Header;