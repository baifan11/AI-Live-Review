import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Tasks from './pages/Tasks';
import Records from './pages/Records';
import RecordDetail from './pages/RecordDetail';
import SettingsPage from './pages/Settings';
import { LayoutDashboard, ListVideo, Settings, Video } from 'lucide-react';
import { cn } from './lib/utils';

const queryClient = new QueryClient();

const NavItem = ({ to, icon: Icon, children }: { to: string; icon: any; children: React.ReactNode }) => {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <Link
      to={to}
      className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
        isActive ? "bg-gray-100 text-black font-medium" : "text-gray-600 hover:bg-gray-50"
      )}
    >
      <Icon size={20} />
      {children}
    </Link>
  );
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <div className="flex min-h-screen bg-gray-50">
          {/* Sidebar */}
          <aside className="w-64 bg-white border-r fixed h-full z-10">
            <div className="p-6">
              <h1 className="text-xl font-bold flex items-center gap-2">
                <span className="w-8 h-8 bg-black text-white rounded flex items-center justify-center">
                  <Video size={18} />
                </span>
                AI Review
              </h1>
            </div>
            <nav className="px-4 space-y-1">
              <NavItem to="/" icon={LayoutDashboard}>Dashboard</NavItem>
              <NavItem to="/tasks" icon={ListVideo}>Tasks</NavItem>
              <NavItem to="/settings" icon={Settings}>Settings</NavItem>
            </nav>
          </aside>

          {/* Main Content */}
          <main className="ml-64 flex-1 min-h-screen">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/tasks" element={<Tasks />} />
              <Route path="/records" element={<Records />} />
              <Route path="/records/:id" element={<RecordDetail />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
