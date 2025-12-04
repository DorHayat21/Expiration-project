import React from 'react';
import Sidebar from './components/Sidebar'; 
import Header from './components/Header';   
import { Outlet } from 'react-router-dom';

const MainLayout = ({ children }) => {
    return (
        <div 
            className="min-h-screen flex font-sans text-right bg-cover bg-center bg-fixed" 
            dir="rtl"
            style={{ 
                // ✅ כאן הוספנו את תמונת הרקע שתופיע בכל העמודים
                backgroundImage: "url('/assets/background.jpg')" 
            }}
        >
            {/* ✅ שכבת כהות חזקה (כדי שהטקסט הלבן יהיה קריא על הרקע) */}
            <div className="fixed inset-0 bg-[#0e1a2b]/85 z-0 pointer-events-none"></div>

            {/* תוכן האתר (חייב להיות מעל הרקע עם z-index) */}
            <div className="relative z-10 flex w-full">
                
                {/* 1. תפריט צד קבוע */}
                <Sidebar />

                {/* 2. אזור התוכן המרכזי */}
                <main className="flex-grow mr-64 p-6 transition-all duration-300">
                    
                    {/* הכותרת העליונה */}
                    <Header />

                    {/* תוכן הדף */}
                    <div className="animate-fade-in">
                        {children ? children : <Outlet />}
                    </div>

                </main>
            </div>
        </div>
    );
};

export default MainLayout;