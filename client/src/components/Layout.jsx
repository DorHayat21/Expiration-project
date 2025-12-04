import React from 'react';
import Sidebar from './Sidebar';
import Header from './Header'; // <-- שורה חדשה: מייבאים את הכותרת
import { Outlet } from 'react-router-dom';

const Layout = () => {
    return (
        // הגדרת כיוון RTL לכל האפליקציה
        <div className="min-h-screen bg-[#0e1a2b] flex font-sans" dir="rtl">
            
            {/* תפריט צד (קבוע) */}
            <Sidebar />

            {/* אזור התוכן המרכזי */}
            {/* mr-56 נותן מרווח מצד ימין כדי שהתוכן לא יעלה על התפריט */}
            <main className="flex-grow mr-56 p-6">
                
                {/* כאן אנחנו שמים את הכותרת שיצרנו */}
                <Header /> 
                
                {/* Outlet מציג את תוכן הדף הספציפי (דף הבית, פריטים וכו') */}
                <Outlet />
            </main>
        </div>
    );
};

export default Layout;