import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// ייבוא הדפים
import Home from './pages/Home';
import Login from './pages/Login';
import Items from './pages/Items';
import Settings from './pages/Settings'; 
import Alert from './pages/Alert';
import Rules from './pages/Rules'; // הייבוא של דף הכללים

// ייבוא ה-MainLayout מהתיקייה הראשית
import MainLayout from './MainLayout'; 

function App() {
  return (
    <Router>
      <Routes>
        {/* 1. דף התחברות (ללא Layout, מסך מלא) */}
        <Route path="/login" element={<Login />} />

        {/* 2. כל שאר הדפים (עטופים בתוך MainLayout כדי שיהיה להם תפריט צדדי) */}
        <Route element={<MainLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/items" element={<Items />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/alerts" element={<Alert />} />
            
            {/* כאן הוספתי את הנתיב לדף הכללים בצורה הנכונה: */}
            <Route path="/rules" element={<Rules />} />
        </Route>

      </Routes>
    </Router>
  );
}

export default App;