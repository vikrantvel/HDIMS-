import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import PatientForm from './components/PatientForm';
import Heatmap from './components/Heatmap';
import Layout from './components/Layout';
import PatientList from './components/PatientList';

import UserManagement from './components/UserManagement';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const role = localStorage.getItem('userRole') || 'staff';
  const isAdmin = role === 'admin' || role === 'super_admin';
  const isSuperAdmin = role === 'super_admin';

  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }, [token]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={!token ? <Login setToken={setToken} /> : <Navigate to="/" />} />
        
        <Route path="/" element={token ? <Layout setToken={setToken} token={token} /> : <Navigate to="/login" />}>
          <Route index element={<Dashboard token={token} />} />
          <Route path="patients" element={isAdmin ? <PatientList token={token} /> : <Navigate to="/" />} />
          <Route path="add-patient" element={isAdmin ? <PatientForm token={token} /> : <Navigate to="/" />} />
          <Route path="edit-patient/:id" element={isAdmin ? <PatientForm token={token} /> : <Navigate to="/" />} />
          <Route path="heatmap" element={<Heatmap token={token} />} />
          <Route path="users" element={isSuperAdmin ? <UserManagement token={token} /> : <Navigate to="/" />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
