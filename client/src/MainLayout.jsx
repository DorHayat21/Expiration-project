import React from 'react';
import { FaUserCircle } from 'react-icons/fa';

const MainLayout = ({ children }) => {
    // בדיקה אם המשתמש הוא אדמין (לצורך התצוגה למעלה)
    const isAdmin = localStorage.getItem('adminToken');

    return (
        <div className="min-h-screen bg-[#0e1a2b] text-white font-sans relative overflow-x-hidden" dir="rtl">
            
            {/* 1. תמונת רקע גלובלית (אם אין תמונה, זה יישאר כחול כהה יפה) */}
            <div 
                className="fixed inset-0 z-0"
                style={{ 
                    background: `linear-gradient(to bottom, rgba(14, 26, 43, 0.85), rgba(14, 26, 43, 0.95)), url('/assets/background.jpg')`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundAttachment: 'fixed'
                }}
            ></div>

            {/* 2. סרגל עליון קבוע (Header) */}
            <header className="relative z-50 bg-[#102542]/80 backdrop-blur-md border-b border-[#1f3c73] px-6 py-3 flex justify-between items-center shadow-lg sticky top-0">
                
                {/* אזור הלוגואים */}
                <div className="flex items-center gap-6">
                    {/* שים את הלוגואים שלך בתיקיית public/assets */}
                    <div className="flex gap-4 items-center opacity-90 hover:opacity-100 transition">
                        {/* Placeholder ללוגואים - יופיעו רק אם הקבצים קיימים */}
                        <img src="/assets/IAF_New_Logo_2018.png" alt="IAF" className="h-12 object-contain" onError={(e) => e.target.style.display = 'none'} />
                        <img src="/assets/Matnam_5656.png" alt="Matnam" className="h-10 object-contain" onError={(e) => e.target.style.display = 'none'} />
                        {/* אם אין לוגואים, הטקסט הזה יופיע */}
                        <h1 className="text-2xl font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 shadow-cyan-500/50 drop-shadow-sm">
                            ExpiryTrack
                        </h1>
                    </div>
                </div>
                
                {/* פרטי משתמש */}
                <div className="flex items-center gap-3 bg-[#162b4d] px-4 py-2 rounded-full border border-[#1f3c73] shadow-inner">
                    <div className="text-right leading-tight hidden md:block">
                        <p className="text-xs text-gray-400">מחובר כ:</p>
                        <p className="text-sm font-bold text-cyan-400">{isAdmin ? 'מנהל מערכת' : 'משתמש'}</p>
                    </div>
                    <FaUserCircle className="text-3xl text-gray-300" />
                </div>
            </header>

            {/* 3. תוכן הדף (כאן יכנסו הטבלאות והדברים המשתנים) */}
            <main className="relative z-10 p-6 max-w-[1600px] mx-auto animate-fade-in-up">
                {children}
            </main>
        </div>
    );
};

export default MainLayout;