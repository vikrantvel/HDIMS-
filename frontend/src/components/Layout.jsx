import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, UserPlus, Map, LogOut, Activity, Users, Shield, Bell } from 'lucide-react';
import { useState, useEffect } from 'react';
import axios from 'axios';

const Layout = ({ setToken, token }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const role = localStorage.getItem('userRole') || 'staff';
  
  const [alerts, setAlerts] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    if (token) {
      const fetchAlerts = async () => {
        try {
          const { data } = await axios.get('/api/alerts', {
            headers: { Authorization: `Bearer ${token}` }
          });
          setAlerts(data);
        } catch (error) {
          console.error(error);
        }
      };
      fetchAlerts();
      const interval = setInterval(fetchAlerts, 3000); 
      return () => clearInterval(interval);
    }
  }, [token]);

  const markAsRead = async (id) => {
    try {
      await axios.put(`/api/alerts/${id}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAlerts(alerts.filter(a => a._id !== id));
      if (alerts.length === 1) setShowDropdown(false);
    } catch (error) {
      console.error(error);
    }
  };

  const handleLogout = () => {
    setToken(null);
    localStorage.removeItem('userRole');
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard }
  ];

  if (role === 'admin' || role === 'super_admin') {
    navItems.push({ name: 'Patient List', path: '/patients', icon: Users });
    navItems.push({ name: 'Add Patient', path: '/add-patient', icon: UserPlus });
  }

  navItems.push({ name: 'Disease Heatmap', path: '/heatmap', icon: Map });

  if (role === 'super_admin') {
    navItems.push({ name: 'Manage Users', path: '/users', icon: Shield });
  }

  return (
    <div className="min-h-screen flex bg-slate-900 text-slate-100 font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-800/50 border-r border-slate-700/50 p-6 flex flex-col glass-panel">
        <div className="flex items-center gap-3 mb-10">
          <Activity size={32} className="text-blue-500 drop-shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
          <h1 className="text-2xl font-bold tracking-tight text-white">HDIMS</h1>
        </div>
        
        <nav className="flex-1 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 hover:translate-x-1 border ${
                  isActive 
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 shadow-lg shadow-blue-500/25 text-white border-blue-500/40' 
                    : 'text-slate-400 hover:bg-slate-800/45 hover:text-slate-100 border-transparent hover:border-slate-800/40'
                }`}
              >
                <Icon size={20} className={`transition-transform duration-300 ${isActive ? 'scale-110 drop-shadow-[0_0_8px_rgba(59,130,246,0.6)]' : ''}`} />
                <span className="font-semibold text-xs uppercase tracking-wider">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <button 
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 mt-auto text-slate-400 hover:text-red-400 transition-colors rounded-xl hover:bg-red-500/10"
        >
          <LogOut size={20} />
          <span className="font-medium">Logout</span>
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto relative flex flex-col">
        {/* Top Header Layer */}
        <header className="flex justify-end p-4 z-20">
            <div className="relative">
                <button 
                    onClick={() => setShowDropdown(!showDropdown)} 
                    className="p-3 bg-slate-800 rounded-full text-slate-300 hover:text-white hover:bg-slate-700 transition relative outline-none"
                >
                    <Bell size={20} />
                    {alerts.length > 0 && (
                        <span className="absolute top-1 right-2 w-3 h-3 bg-red-500 rounded-full border-2 border-slate-800"></span>
                    )}
                </button>
                {showDropdown && (
                    <div className="absolute right-0 mt-2 w-80 bg-slate-800 border border-slate-700 rounded-lg shadow-2xl z-50 overflow-hidden">
                        <div className="p-4 border-b border-slate-700 bg-slate-800/80">
                            <h3 className="font-bold text-white text-sm">Notifications</h3>
                        </div>
                        <div className="max-h-64 overflow-y-auto">
                            {alerts.length === 0 ? (
                                <div className="p-4 text-center text-sm text-slate-400">No new alerts.</div>
                            ) : (
                                alerts.map(a => (
                                    <div key={a._id} className="p-4 border-b border-slate-700/50 hover:bg-slate-700/30 transition">
                                        <p className="text-xs font-bold text-rose-400 mb-1">{a.title}</p>
                                        <p className="text-xs text-slate-300 mb-2">{a.message}</p>
                                        <button 
                                            onClick={() => markAsRead(a._id)}
                                            className="text-xs text-blue-400 font-semibold hover:text-blue-300"
                                        >
                                            Mark as Read
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>
        </header>

        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none -z-10" />
        <div className="max-w-6xl mx-auto z-10 p-8 w-full">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
