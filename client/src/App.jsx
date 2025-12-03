import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Items from './pages/Items';
import Settings from './pages/Settings';
import Alert from './pages/Alert';
import Layout from './components/Layout'; // Import the new Layout

// This is the root component that defines all application routes
function App() {
  return (
    <Router>
      <Routes>
        {/* Public Route: Login page is outside the protected layout */}
        <Route path="/login" element={<Login />} />
        
        {/* Private Routes Wrapper: All authenticated routes use the Layout component */}
        {/* The path="/" on the Layout ensures the Sidebar structure is always visible */}
        <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/items" element={<Items />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/alerts" element={<Alert />} />
            <Route path="/catalog" element={<Alert />} /> {/* Added for Catalog View */}
        </Route>

        {/* You may want a redirect or 404 handler here */}
      </Routes>
    </Router>
  );
}

export default App;