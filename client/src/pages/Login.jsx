import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Login = () => {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });
    const { email, password } = formData;
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const onChange = (e) => {
        setFormData((prevState) => ({
            ...prevState,
            [e.target.name]: e.target.value,
        }));
    };

    const onSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        const userData = { email, password };

        try {
            const response = await axios.post('http://localhost:5000/api/users/login', userData);

            if (response.data.token) {
                const { token, role } = response.data;

                // --- תיקון חשוב: שמירת התפקיד הספציפי ---
                // זה יאפשר לנו בהמשך לדעת אם המשתמש הוא viewer, editor או user רגיל
                localStorage.setItem('userRole', role); 
                // ----------------------------------------

                if (role && role.toLowerCase() === 'admin') {
                    localStorage.setItem('adminToken', token);
                    localStorage.removeItem('userToken');
                } else {
                    // כאן נכנסים גם USER וגם VIEWER (שניהם מקבלים טוקן רגיל)
                    // אבל בזכות השורה למעלה (userRole), נדע להבדיל ביניהם אח"כ
                    localStorage.setItem('userToken', token);
                    localStorage.removeItem('adminToken');
                }

                navigate('/');
            }
        } catch (err) {
            console.error("Login Error:", err);
            
            if (err.response && (err.response.status === 400 || err.response.status === 401)) {
                setError('כתובת הדוא״ל או הסיסמה שהזנת שגויים. אנא נסה שוב.');
            } else {
                setError('שגיאת תקשורת, אנא נסה שנית מאוחר יותר.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div 
            className="min-h-screen flex flex-col items-center justify-center font-sans bg-cover bg-center relative"
            style={{ 
                // שימוש ישיר בקובץ מתוך תיקיית public
                backgroundImage: "url('/assets/background.png')" 
            }}
            dir="rtl"
        >
            {/* שכבת כהות על הרקע */}
            <div className="absolute inset-0 bg-black/60 z-0"></div>

            {/* --- חלק עליון: לוגואים וכותרת --- */}
            <div className="relative z-10 w-full max-w-4xl flex flex-col items-center mb-8">
                {/* שורת הלוגואים - נתיבים ישירים לתיקיית public */}
                <div className="flex justify-center gap-6 mb-4 bg-white/10 p-3 rounded-xl backdrop-blur-sm">
                    <img src="/assets/IAF_New_Logo_2018.png" alt="IAF" className="h-16 object-contain drop-shadow-lg" />
                    <img src="/assets/tech-wing.png" alt="Tech Wing" className="h-16 object-contain drop-shadow-lg" />
                    <img src="/assets/Bamza_108.png" alt="Bamza" className="h-16 object-contain drop-shadow-lg" />
                    <img src="/assets/Matnam_5656.png" alt="Matnam" className="h-16 object-contain drop-shadow-lg" />
                </div>
                
                <h1 className="text-4xl md:text-5xl font-bold text-white tracking-wide drop-shadow-md text-center">
                    מערכת פגי תוקף יחידת מתנ"ם
                </h1>
                <p className="text-gray-300 mt-2 text-lg">מערכת לניהול וניטור פריטים</p>
            </div>

            {/* --- כרטיס ההתחברות --- */}
            <div className="relative z-10 p-10 rounded-2xl shadow-2xl w-full max-w-md bg-white/95 backdrop-blur-md border border-gray-200">
                
                <h2 className="text-2xl font-bold mb-6 text-center text-[#1b3c66]">
                    כניסה למערכת
                </h2>

                {error && (
                    <div className="bg-red-50 border-r-4 border-red-500 text-red-700 p-4 rounded mb-6 text-sm shadow-sm">
                        <p className="font-bold">שגיאה</p>
                        <p>{error}</p>
                    </div>
                )}

                <form onSubmit={onSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                            דוא"ל אישי
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                                </svg>
                            </div>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={email}
                                onChange={onChange}
                                required
                                placeholder="name@example.com"
                                className="block w-full pr-10 pl-3 py-3 border border-gray-300 rounded-lg focus:ring-[#1b3c66] focus:border-[#1b3c66] sm:text-sm bg-gray-50 hover:bg-white transition-colors"
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                            סיסמה
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                            </div>
                            <input
                                type="password"
                                id="password"
                                name="password"
                                value={password}
                                onChange={onChange}
                                required
                                placeholder="••••••••"
                                className="block w-full pr-10 pl-3 py-3 border border-gray-300 rounded-lg focus:ring-[#1b3c66] focus:border-[#1b3c66] sm:text-sm bg-gray-50 hover:bg-white transition-colors"
                            />
                        </div>
                    </div>

                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={isLoading}
                            className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-md text-sm font-bold text-white transition-all duration-200
                                ${isLoading 
                                    ? 'bg-gray-400 cursor-not-allowed' 
                                    : 'bg-[#1b3c66] hover:bg-[#162b4d] hover:shadow-lg active:scale-95'
                                }`}
                        >
                            {isLoading ? 'מתחבר...' : 'התחברות'}
                        </button>
                    </div>
                </form>
            </div>

            {/* --- פוטר (Footer) --- */}
            <div className="relative z-10 mt-8 text-center">
                <p className="text-white/80 font-medium text-sm bg-black/20 px-4 py-1 rounded-full backdrop-blur-sm">
                    האתר נבנה על ידי דור חייט
                </p>
            </div>
        </div>
    );
};

export default Login;