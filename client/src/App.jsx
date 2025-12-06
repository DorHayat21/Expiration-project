import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// ייבוא הדפים
import Home from './pages/Home';
import Login from './pages/Login';
import Items from './pages/Items';
import Settings from './pages/Settings'; 
import Rules from './pages/Rules'; 

// --- השינוי כאן: ייבוא הדשבורד החדש במקום Alert ---
import Dashboard from './pages/Dashboard'; 

// ייבוא ה-MainLayout מהתיקייה הראשית
import MainLayout from './MainLayout'; 

function App() {
  return (
    <Router>
      <Routes>
        {/* 1. דף התחברות (ללא Layout, מסך מלא) */}
        <Route path="/login" element={<Login />} />

        {/* 2. כל שאר הדפים (עטופים בתוך MainLayout) */}
        <Route element={<MainLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/items" element={<Items />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/rules" element={<Rules />} />
            
            {/* --- השינוי כאן: הוספנו את הנתיב לדף הגרפי --- */}
            {/* שים לב שהנתיב /dashboard חייב להיות זהה למה שכתבנו ב-Sidebar */}
            <Route path="/dashboard" element={<Dashboard />} />
            
        </Route>

      </Routes>
    </Router>
  );
}

export default App;