import React, { useState } from 'react';
import axios from 'axios'; 

const Login = () => {
    // Component State Management (for form data)
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });
    const { email, password } = formData;
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    // Handles changes in form inputs
    const onChange = (e) => {
        setFormData((prevState) => ({
            ...prevState,
            [e.target.name]: e.target.value,
        }));
    };

    // Handles form submission
    const onSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        
        const userData = { email, password };

        try {
            // Send request to the API endpoint (Proxy will redirect to :5000)
            const response = await axios.post('/api/users/login', userData);
            
            // המידע שמגיע מהשרת עכשיו כולל את role, בזכות התיקון ב-Backend
            if (response.data.token) {
                const { token, role } = response.data; // מפרק את הנתונים מהתשובה
                
                // --- לוגיקת אחסון הטוקן המתוקנת! ---
                if (role && role.toLowerCase() === 'admin') { 
                    localStorage.setItem('adminToken', token);
                    localStorage.removeItem('userToken');
                    console.log('Admin logged in! Storing adminToken.');
                } else {
                    localStorage.setItem('userToken', token);
                    localStorage.removeItem('adminToken');
                    console.log('User logged in! Storing userToken.');
                }
                // ------------------------------------

                window.location.href = '/'; 
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed due to network error.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        // Full screen, dark background using Tailwind classes
        <div className="min-h-screen bg-[#0e1a2b] flex items-center justify-center">
            <div className="p-8 rounded-lg shadow-2xl w-full max-w-md bg-[#162b4d] border border-[#1b3c66]">
                <h1 className="text-3xl font-bold mb-6 text-center text-white">כניסה למערכת</h1>
                
                {error && (
                    <div className="bg-red-800 text-white p-3 rounded mb-4 text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={onSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-300">
                            דוא"ל אישי
                        </label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={email}
                            onChange={onChange}
                            required
                            className="mt-1 block w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm bg-gray-700 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                    </div>

                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-300">
                            סיסמה
                        </label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            value={password}
                            onChange={onChange}
                            required
                            className="mt-1 block w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm bg-gray-700 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white 
                                ${isLoading ? 'bg-gray-600' : 'bg-[#1b3c66] hover:bg-[#123057]'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                        >
                            {isLoading ? 'מתחבר...' : 'התחברות'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Login;