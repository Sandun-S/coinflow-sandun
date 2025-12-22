import Sidebar from './Sidebar';
import MobileNav from './MobileNav';
import MobileHeader from './MobileHeader';

const MainLayout = ({ children }) => {
    return (
        <div className="flex h-screen bg-slate-50 dark:bg-slate-900 font-sans transition-colors duration-200 overflow-hidden">
            {/* Sidebar (Desktop Only) */}
            <aside className="hidden md:flex md:w-64 z-30 flex-col fixed inset-y-0">
                <Sidebar />
            </aside>

            {/* Mobile Header (Top) */}
            <MobileHeader />

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto w-full p-4 md:p-8 md:ml-64 relative pb-20 pt-20 md:pt-8 md:pb-8">
                <div className="max-w-7xl mx-auto space-y-8">
                    {children}
                </div>
            </main>

            {/* Mobile Navigation (Bottom) */}
            <MobileNav />
        </div>
    );
};

export default MainLayout;
