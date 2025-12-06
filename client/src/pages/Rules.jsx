import React from 'react';
import { FaBook, FaTrafficLight, FaCheckCircle, FaExclamationTriangle, FaTimesCircle, FaStopwatch, FaUserShield, FaHandPointRight } from 'react-icons/fa';

const Rules = () => {
    return (
        <div className="animate-fade-in-up max-w-6xl mx-auto pb-10">
            
            {/* כותרת הדף */}
            <div className="mb-10 text-center md:text-right">
                <h1 className="text-4xl font-extrabold text-white mb-3 flex items-center justify-center md:justify-start gap-3">
                    <span className="bg-purple-500/20 p-3 rounded-xl text-purple-400"><FaBook /></span>
                    נהלי שימוש במערכת
                </h1>
                <p className="text-slate-400 text-lg max-w-3xl">
                    מדריך למשתמש הכולל הסבר על אופן פעולת המערכת, זמני קבלת התראות ומה נדרש לבצע.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                {/* כרטיס 1: הסבר על הסטטוסים (רמזור) */}
                <div className="bg-slate-800/60 backdrop-blur-md p-8 rounded-2xl border border-slate-700 shadow-xl">
                    <div className="flex items-center gap-3 mb-6 border-b border-slate-700 pb-4">
                        <FaTrafficLight className="text-3xl text-blue-400" />
                        <h2 className="text-2xl font-bold text-white">מקרא סטטוסים</h2>
                    </div>
                    
                    <div className="space-y-6">
                        {/* ירוק */}
                        <div className="flex items-start gap-4">
                            <div className="mt-1"><FaCheckCircle className="text-green-400 text-xl" /></div>
                            <div>
                                <h3 className="text-green-400 font-bold text-lg">תקין (בתוקף)</h3>
                                <p className="text-slate-300 text-sm">הציוד תקין, בתוקף ומוכן לשימוש. אין צורך בביצוע פעולה.</p>
                            </div>
                        </div>

                        {/* צהוב */}
                        <div className="flex items-start gap-4">
                            <div className="mt-1"><FaExclamationTriangle className="text-yellow-400 text-xl" /></div>
                            <div>
                                <h3 className="text-yellow-400 font-bold text-lg">עומד לפוג (נדרשת פעולה)</h3>
                                <p className="text-slate-300 text-sm">התוקף עומד להסתיים בקרוב מאוד. יש להיערך לחידוש, בדיקה או החלפה של הציוד.</p>
                            </div>
                        </div>

                        {/* אדום */}
                        <div className="flex items-start gap-4">
                            <div className="mt-1"><FaTimesCircle className="text-red-500 text-xl" /></div>
                            <div>
                                <h3 className="text-red-500 font-bold text-lg">פג תוקף (קריטי)</h3>
                                <p className="text-slate-300 text-sm">הציוד אינו בתוקף! אסור לשימוש. יש לטפל מיידית מול הגורם האחראי.</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* כרטיס 2: חוקי ההתראות (הלוגיקה החדשה) */}
                <div className="bg-slate-800/60 backdrop-blur-md p-8 rounded-2xl border border-slate-700 shadow-xl">
                    <div className="flex items-center gap-3 mb-6 border-b border-slate-700 pb-4">
                        <FaStopwatch className="text-3xl text-cyan-400" />
                        <h2 className="text-2xl font-bold text-white">מתי מופיעה התראה?</h2>
                    </div>

                    <p className="text-slate-300 mb-6">
                        המערכת מחשבת את זמן ההתראה באופן אוטומטי בהתאם ל"אורך החיים" של הפריט (לפי נהלי היחידה):
                    </p>

                    <div className="space-y-4">
                        <div className="bg-slate-700/50 p-4 rounded-xl border-r-4 border-cyan-500">
                            <h4 className="font-bold text-white text-lg mb-1">פריטים עם תוקף קצר (עד 30 יום)</h4>
                            <p className="text-slate-400 text-sm">כגון: בדיקות חודשיות.</p>
                            <div className="mt-2 text-yellow-400 font-bold text-sm flex items-center gap-2">
                                <FaExclamationTriangle />
                                התראה תופיע 3 ימים לפני הפקיעה.
                            </div>
                        </div>

                        <div className="bg-slate-700/50 p-4 rounded-xl border-r-4 border-blue-500">
                            <h4 className="font-bold text-white text-lg mb-1">פריטים עם תוקף ארוך (מעל 30 יום)</h4>
                            <p className="text-slate-400 text-sm">כגון: ציוד שנתי.</p>
                            <div className="mt-2 text-yellow-400 font-bold text-sm flex items-center gap-2">
                                <FaExclamationTriangle />
                                התראה תופיע 7 ימים לפני הפקיעה.
                            </div>
                        </div>
                    </div>
                </div>

                {/* כרטיס 3: אחריות המשתמש */}
                <div className="md:col-span-2 bg-gradient-to-r from-slate-800 to-slate-900 backdrop-blur-md p-8 rounded-2xl border border-slate-700 shadow-xl">
                    <div className="flex items-center gap-3 mb-6">
                        <FaUserShield className="text-3xl text-emerald-400" />
                        <h2 className="text-2xl font-bold text-white">אחריות המשתמש / בעל התפקיד</h2>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                        <div className="bg-slate-800/80 p-5 rounded-xl">
                            <div className="text-4xl mb-3">👁️</div>
                            <h3 className="text-white font-bold mb-2">מעקב שוטף</h3>
                            <p className="text-slate-400 text-sm">יש להיכנס למערכת אחת לשבוע ולוודא שאין פריטים בסטטוס "עומד לפוג" או "פג תוקף".</p>
                        </div>
                        
                        <div className="bg-slate-800/80 p-5 rounded-xl">
                            <div className="text-4xl mb-3">✍️</div>
                            <h3 className="text-white font-bold mb-2">חידוש ועדכון</h3>
                            <p className="text-slate-400 text-sm">ביצעת בדיקה או חידוש ציוד? ניתן למחוק פריט שאינו רלוונטי יותר או לעדכן בו את תאריך הבדיקה האחרון</p>
                        </div>

                        <div className="bg-slate-800/80 p-5 rounded-xl">
                            <div className="text-4xl mb-3">📢</div>
                            <h3 className="text-white font-bold mb-2">דיווח על תקלות</h3>
                            <p className="text-slate-400 text-sm">במידה ונתוני המערכת אינם תואמים את המצב בשטח, יש לפנות למנהל המערכת מיידית.</p>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default Rules;