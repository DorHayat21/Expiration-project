import Sidebar from './Sidebar';
import { Outlet } from 'react-router-dom';

const Layout = () => {
    return (
        // Main container sets the dark background
        <div className="min-h-screen bg-[#0e1a2b] flex">
            
            {/* 1. Sidebar (fixed width) */}
            <Sidebar />

            {/* 2. Main content area (pushes content away from the fixed sidebar) */}
            <main className="flex-grow mr-56 p-6">
                {/* Outlet renders the specific child route (Home, Items, etc.) */}
                <Outlet />
            </main>
        </div>
    );
};

export default Layout;