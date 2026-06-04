import { useState, useEffect } from 'react';
import axios from 'axios';
import { Shield, ShieldAlert, ShieldCheck } from 'lucide-react';

const UserManagement = ({ token }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, [token]);

  const fetchUsers = async () => {
    try {
      const { data } = await axios.get('/api/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Error fetching users (Are you Super Admin?)');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await axios.put(`/api/users/${userId}/role`, { role: newRole }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Refresh user list smoothly
      setUsers(users.map(u => u._id === userId ? { ...u, role: newRole } : u));
    } catch (err) {
      alert(err.response?.data?.message || 'Error updating role');
    }
  };

  if (loading) return <div className="text-white text-center py-12">Loading Users...</div>;
  if (error) return <div className="text-red-400 text-center py-12">{error}</div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h2 className="text-4xl font-bold tracking-tight text-white mb-2">User Management</h2>
        <p className="text-slate-400 text-lg">Manage system access and assign roles</p>
      </div>

      <div className="glass-panel p-8 rounded-3xl border border-slate-700/50 shadow-2xl">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="text-xs uppercase text-slate-400 font-bold border-b border-slate-700/50 tracking-wider">
            <tr>
              <th className="px-4 py-5">Name</th>
              <th className="px-4 py-5">Email</th>
              <th className="px-4 py-5">Current Role</th>
              <th className="px-4 py-5">Change Role</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u._id} className="border-b border-slate-700/30 hover:bg-slate-800/60 transition-colors">
                <td className="px-4 py-5 text-base font-medium text-white">{u.name}</td>
                <td className="px-4 py-5 text-base">{u.email}</td>
                <td className="px-4 py-5">
                  <div className="flex items-center gap-2">
                    {u.role === 'super_admin' ? <ShieldAlert size={16} className="text-purple-400" /> : 
                     u.role === 'admin' ? <ShieldCheck size={16} className="text-blue-400" /> : 
                     <Shield size={16} className="text-slate-400" />}
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                      u.role === 'super_admin' ? 'bg-purple-500/20 text-purple-400 border-purple-500/30' :
                      u.role === 'admin' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' :
                      'bg-slate-500/20 text-slate-400 border-slate-500/30'
                    }`}>
                      {u.role}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-5">
                  <select 
                    value={u.role} 
                    onChange={(e) => handleRoleChange(u._id, e.target.value)}
                    className="bg-slate-900 border border-slate-700 text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                  >
                    <option value="staff">Staff</option>
                    <option value="admin">Admin</option>
                    <option value="super_admin">Super Admin</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserManagement;
