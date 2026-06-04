import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { Mic, MicOff, Save, MapPin, Activity, User, Calendar } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';

const PatientForm = ({ token }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);

  const [formData, setFormData] = useState({
    name: '',
    age: '',
    disease: '',
    severity: 'Moderate',
    status: 'Active',
    locationName: '',
    latitude: '',
    longitude: ''
  });
  const [isListening, setIsListening] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const isListeningRef = useRef(false);

  useEffect(() => {
    if (isEditMode) {
      const fetchPatient = async () => {
        try {
          const { data } = await axios.get('/api/patients', {
            headers: { Authorization: `Bearer ${token}` }
          });
          const patient = data.find(p => p._id === id);
          if (patient) {
            setFormData({
              name: patient.name,
              age: patient.age.toString(),
              disease: patient.disease,
              severity: patient.severity,
              status: patient.status || 'Active',
              locationName: patient.locationName || '',
              latitude: patient.location?.coordinates[1]?.toString() || '',
              longitude: patient.location?.coordinates[0]?.toString() || ''
            });
          }
        } catch (e) {
          console.error("Error fetching patient", e);
        }
      };
      fetchPatient();
    }
  }, [id, isEditMode, token]);
  
  const recognitionRef = useRef(null);

  useEffect(() => {
    let activeRecognition = null;
    let keepListening = true;

    const startAmbientListening = () => {
      if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        console.log("Speech recognition not supported in this browser");
        return;
      }
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = 'en-US';

      rec.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const trans = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += trans;
          } else {
            interimTranscript += trans;
          }
        }
        
        const fullText = (finalTranscript + interimTranscript).toLowerCase();
        
        // Auto wake logic when user says "hello"
        if (fullText.includes("hello") && !isListeningRef.current) {
          setIsListening(true);
          isListeningRef.current = true;
        }

        if (isListeningRef.current) {
          processVoiceCommand(fullText);
        }
      };

      rec.onerror = (event) => {
        console.log("Ambient speech error:", event.error);
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          keepListening = false;
        }
      };

      rec.onend = () => {
        // Loop ambient listening to keep it active
        if (keepListening) {
          try {
            rec.start();
          } catch (e) {
            console.log("Restart failed:", e);
          }
        }
      };

      try {
        rec.start();
        activeRecognition = rec;
      } catch (e) {
        console.log("Initial speech start failed:", e);
      }
    };

    startAmbientListening();

    return () => {
      keepListening = false;
      if (activeRecognition) {
        try {
          activeRecognition.stop();
        } catch (e) {}
      }
    };
  }, []);

  const processVoiceCommand = (text) => {
    // Simple RegExp NLP parsing for dictation mapping
    let nameMatch = text.match(/name is ([a-z\s]+)(?: and| age| disease| severity| location|$)/);
    let ageMatch = text.match(/age (is )?(\d+)/);
    let devMatch = text.match(/disease (is )?([a-z\s]+)(?: and| name| age| severity| location|$)/);
    let locMatch = text.match(/location (is )?([a-z\s0-9,]+)(?: and| name| age| disease| severity|$)/);
    let sevMatch = text.match(/severity (is )?(mild|moderate|severe|critical)/);
    
    setFormData(prev => ({
      ...prev,
      name: nameMatch ? nameMatch[1].trim() : prev.name,
      age: ageMatch ? ageMatch[2] : prev.age,
      disease: devMatch ? devMatch[2].trim() : prev.disease,
      severity: sevMatch ? sevMatch[2].charAt(0).toUpperCase() + sevMatch[2].slice(1) : prev.severity,
      locationName: locMatch ? locMatch[2].trim() : prev.locationName
    }));
  };

  const toggleListen = () => {
    const nextListening = !isListening;
    setIsListening(nextListening);
    isListeningRef.current = nextListening;
  };

  const getLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        setFormData(prev => ({
          ...prev,
          latitude: position.coords.latitude.toFixed(6),
          longitude: position.coords.longitude.toFixed(6)
        }));
      });
    } else {
      alert("Geolocation is not supported by this browser.");
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccess('');
    try {
      if (!formData.latitude || !formData.longitude) {
        alert("Please map the coordinates for the heatmap component using actual coordinates!");
        setLoading(false);
        return;
      }
      
      const payload = {
        name: formData.name,
        age: parseInt(formData.age, 10),
        disease: formData.disease,
        severity: formData.severity,
        status: formData.status,
        locationName: formData.locationName,
        coordinates: [parseFloat(formData.longitude), parseFloat(formData.latitude)]
      };
      
      if (isEditMode) {
        await axios.put(`/api/patients/${id}`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSuccess('Patient record updated successfully!');
      } else {
        await axios.post('/api/patients', payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSuccess('Patient record created successfully!');
      }
      setFormData({ name: '', age: '', disease: '', severity: 'Moderate', status: 'Active', locationName: '', latitude: '', longitude: '' });
      setTimeout(() => navigate('/'), 2000);
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.message || 'Error occurred while saving.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white mb-2">{isEditMode ? 'Edit Patient' : 'Patient Intake'}</h2>
          <p className="text-slate-400">{isEditMode ? 'Update existing health record data' : 'Add new health records manually or via voice command'}</p>
        </div>
        
        <button 
          onClick={toggleListen}
          type="button"
          className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold transition-all shadow-lg ${isListening ? 'bg-red-500/20 text-red-400 border border-red-500/50 shadow-red-500/20 animate-pulse' : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/25 border border-transparent'}`}
        >
          {isListening ? <MicOff size={20} /> : <Mic size={20} />}
          {isListening ? 'Stop Listening' : 'Voice Dictation'}
        </button>
      </div>

      {/* Permanent Voice Dictation Guidance HUD Indicator */}
      <div className="mb-6 p-4 rounded-xl border bg-blue-950/20 border-blue-500/20 text-slate-300 shadow-lg flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex gap-1 items-end h-4 shrink-0 text-blue-400">
            <span className="w-1 rounded-full h-2 bg-blue-500"></span>
            <span className="w-1 rounded-full h-4 bg-blue-500"></span>
            <span className="w-1 rounded-full h-3 bg-blue-500"></span>
          </div>
          <p className="text-sm font-medium leading-relaxed">
            Try saying: <span className="text-blue-400 font-bold">"Hello, name is John Doe, age 45, disease is Malaria, severity is Critical, location is Downtown"</span>
          </p>
        </div>
        <div className="text-[9px] uppercase font-black tracking-widest px-2.5 py-1.5 rounded border shrink-0 hidden sm:block bg-blue-500/10 border-blue-500/20 text-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.05)]">
          {isListening ? 'Listening Active' : 'Ambient Mic Active'}
        </div>
      </div>

      {success && (
        <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl font-medium flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="glass-panel p-8 rounded-3xl shadow-2xl border border-slate-700/50 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300 ml-1">Full Name</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
              <input type="text" name="name" required value={formData.name} onChange={handleChange} className="w-full bg-slate-900/50 border border-slate-700 rounded-xl pl-12 pr-4 py-3.5 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all" placeholder="e.g. Jane Smith" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300 ml-1">Age</label>
            <div className="relative">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
              <input type="number" name="age" required value={formData.age} onChange={handleChange} className="w-full bg-slate-900/50 border border-slate-700 rounded-xl pl-12 pr-4 py-3.5 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all" placeholder="e.g. 34" />
            </div>
          </div>

          <div className="space-y-2 md:col-span-2 lg:col-span-1">
            <label className="text-sm font-medium text-slate-300 ml-1">Disease / Diagnosis</label>
            <div className="relative">
              <Activity className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
              <input type="text" name="disease" required value={formData.disease} onChange={handleChange} className="w-full bg-slate-900/50 border border-slate-700 rounded-xl pl-12 pr-4 py-3.5 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all" placeholder="e.g. COVID-19, Malaria" />
            </div>
          </div>

          <div className="space-y-2 lg:col-span-1">
            <label className="text-sm font-medium text-slate-300 ml-1">Severity</label>
            <div className="relative">
              <Activity className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
              <select name="severity" value={formData.severity} onChange={handleChange} className="w-full bg-slate-900/50 border border-slate-700 rounded-xl pl-12 pr-4 py-3.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all appearance-none cursor-pointer">
                <option value="Mild">Mild</option>
                <option value="Moderate">Moderate</option>
                <option value="Severe">Severe</option>
                <option value="Critical">Critical</option>
              </select>
            </div>
          </div>

          <div className="space-y-2 lg:col-span-1">
            <label className="text-sm font-medium text-slate-300 ml-1">Status</label>
            <div className="relative">
              <Activity className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
              <select name="status" value={formData.status} onChange={handleChange} className="w-full bg-slate-900/50 border border-slate-700 rounded-xl pl-12 pr-4 py-3.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all appearance-none cursor-pointer">
                <option value="Active">Active</option>
                <option value="Recovered">Recovered</option>
                <option value="Deceased">Deceased</option>
              </select>
            </div>
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium text-slate-300 ml-1">Location Name</label>
            <div className="relative">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
              <input type="text" name="locationName" required value={formData.locationName} onChange={handleChange} className="w-full bg-slate-900/50 border border-slate-700 rounded-xl pl-12 pr-4 py-3.5 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all" placeholder="e.g. Downtown Residential Area" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300 ml-1">Latitude</label>
            <input type="text" name="latitude" required value={formData.latitude} onChange={handleChange} className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all" placeholder="-34.6037" />
          </div>

          <div className="space-y-2 relative flex flex-col justify-end">
            <div className="absolute right-2 top-8 md:top-8 flex gap-2">
              <button type="button" onClick={getLocation} className="bg-slate-700 hover:bg-slate-600 text-slate-200 px-3 py-1.5 rounded-lg text-xs transition-colors font-medium hover:text-white">
                Get Current
              </button>
            </div>
            <label className="text-sm font-medium text-slate-300 ml-1">Longitude</label>
            <input type="text" name="longitude" required value={formData.longitude} onChange={handleChange} className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3.5 pr-28 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all" placeholder="-58.3816" />
          </div>
        </div>

        <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold py-4 rounded-xl transition-all shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:shadow-[0_0_25px_rgba(59,130,246,0.5)] mt-8 disabled:opacity-75 disabled:cursor-not-allowed">
          <Save size={20} />
          {loading ? 'Saving Record...' : (isEditMode ? 'Update Patient Record' : 'Save Patient Record')}
        </button>
      </form>
    </div>
  );
};
export default PatientForm;
