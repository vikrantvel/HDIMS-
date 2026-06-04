import { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Plus, Eye, Edit2, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const PatientList = ({ token }) => {
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [patientToDelete, setPatientToDelete] = useState(null);

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const { data } = await axios.get('/api/patients', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setPatients(data);
      } catch (error) {
        console.error('Error fetching patients:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchPatients();
  }, [token]);

  const confirmDelete = async () => {
    if (!patientToDelete) return;
    try {
      await axios.delete(`/api/patients/${patientToDelete}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPatients(patients.filter(p => p._id !== patientToDelete));
      setPatientToDelete(null);
    } catch (error) {
      alert(error.response?.data?.message || 'Error deleting patient');
    }
  };

  const filteredPatients = patients.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    (p.patientId && p.patientId.toLowerCase().includes(search.toLowerCase())) ||
    p.disease.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusBadge = (status, severity) => {
    if (status === 'Recovered') return <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-xs font-bold border border-emerald-500/30">Recovered</span>;
    if (severity === 'Critical') return <span className="px-3 py-1 bg-rose-500/20 text-rose-400 rounded-full text-xs font-bold border border-rose-500/30">Critical</span>;
    return <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs font-bold border border-blue-500/30">Active</span>;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h2 className="text-4xl font-bold tracking-tight text-white mb-2">Patient Management</h2>
          <p className="text-slate-400 text-lg">View and manage patient records</p>
        </div>
        <Link to="/add-patient" className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold px-6 py-3 rounded-xl transition-all shadow-lg shadow-blue-500/25">
          <Plus size={20} />
          Add Patient
        </Link>
      </div>

      {patientToDelete && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-[100] animate-in fade-in">
          <div className="bg-slate-800 p-8 rounded-2xl border border-rose-500/30 shadow-2xl shadow-rose-500/10 max-w-md w-full mx-4">
            <h3 className="text-2xl font-bold text-white mb-2">Delete Patient</h3>
            <p className="text-slate-400 mb-8">Are you sure you want to permanently delete this record? This action cannot be undone and all data will be lost.</p>
            <div className="flex gap-4 justify-end">
              <button onClick={() => setPatientToDelete(null)} className="px-5 py-2.5 rounded-xl border border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors font-medium">Cancel</button>
              <button onClick={confirmDelete} className="px-5 py-2.5 rounded-xl bg-rose-600 text-white hover:bg-rose-500 shadow-lg shadow-rose-500/20 font-medium transition-all">Yes, Delete</button>
            </div>
          </div>
        </div>
      )}

      <div className="glass-panel p-8 rounded-3xl border border-slate-700/50 shadow-2xl space-y-8">
        <div className="relative max-w-3xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
          <input 
            type="text" 
            placeholder="Search by name, ID, or diagnosis..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900/50 border border-slate-700/80 rounded-xl pl-12 pr-4 py-4 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-lg"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="text-xs uppercase text-slate-400 font-bold border-b border-slate-700/50 tracking-wider">
              <tr>
                <th className="px-4 py-5">Patient ID</th>
                <th className="px-4 py-5">Name</th>
                <th className="px-4 py-5">Age</th>
                <th className="px-4 py-5">Diagnosis</th>
                <th className="px-4 py-5">Region</th>
                <th className="px-4 py-5">Status</th>
                <th className="px-4 py-5 text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="7" className="text-center py-12">Loading Records...</td></tr>
              ) : filteredPatients.length === 0 ? (
                <tr><td colSpan="7" className="text-center py-12 text-slate-500 text-lg">No matching records found.</td></tr>
              ) : (
                filteredPatients.map((p) => (
                  <tr key={p._id} className="border-b border-slate-700/30 hover:bg-slate-800/60 transition-colors">
                    <td className="px-4 py-5 font-bold text-white text-base">{p.patientId || 'N/A'}</td>
                    <td className="px-4 py-5 text-base">{p.name}</td>
                    <td className="px-4 py-5 text-base">{p.age}</td>
                    <td className="px-4 py-5 text-base">{p.disease}</td>
                    <td className="px-4 py-5 text-base">{p.region} Region</td>
                    <td className="px-4 py-5">{getStatusBadge(p.status, p.severity)}</td>
                    <td className="px-4 py-5 text-center">
                      <div className="flex justify-center gap-2">
                        <Link to={`/edit-patient/${p._id}`} className="text-indigo-400 hover:text-indigo-300 p-2 rounded-lg hover:bg-indigo-500/10 transition-colors tooltip relative group">
                          <Edit2 size={20} />
                          <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap z-50">Edit Record</span>
                        </Link>
                        <button onClick={() => setPatientToDelete(p._id)} className="text-rose-400 hover:text-rose-300 p-2 rounded-lg hover:bg-rose-500/10 transition-colors tooltip relative group">
                          <Trash2 size={20} />
                          <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap z-50">Delete Record</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PatientList;
