import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Mock Chart Component for visualization (since we can't install Recharts easily in this snippet)
const SimpleBar = ({ value, max, color }) => (
  <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
    <div 
      className={`h-2.5 rounded-full ${color}`} 
      style={{ width: `${Math.min((value / max) * 100, 100)}%` }}
    ></div>
  </div>
);

function App() {
    const [dataLahan, setDataLahan] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchData = async () => {
        try {
            const result = await axios.get('http://localhost:8080/api/sensors/latest-all');
            setDataLahan(result.data);
            setLoading(false);
        } catch (err) {
            console.error("Error fetching data:", err);
            setError("Gagal mengambil data dari server.");
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 5000);
        return () => clearInterval(interval);
    }, []);

    const getStatusColor = (type, value) => {
        if (type === 'moisture') {
            if (value < 30) return 'text-red-600';
            if (value > 70) return 'text-blue-600';
            return 'text-green-600';
        }
        if (type === 'temp') {
            if (value > 35) return 'text-red-600';
            return 'text-orange-600';
        }
        return 'text-gray-800';
    };

    return (
        <div className="p-4 md:p-8 bg-slate-50 min-h-screen font-sans">
            <header className="mb-8 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-800">
                        Smart Farming Dashboard
                    </h1>
                    <p className="text-slate-500">Monitoring Kondisi Lahan Real-time</p>
                </div>
                <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full animate-pulse ${loading ? 'bg-yellow-400' : 'bg-green-500'}`}></div>
                    <span className="text-sm font-medium text-slate-600">
                        {loading ? 'Syncing...' : 'System Online'}
                    </span>
                </div>
            </header>

            {error && (
                <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded shadow-sm">
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {dataLahan.length === 0 && !loading && (
                    <div className="col-span-full text-center py-12 bg-white rounded-xl shadow-sm border border-dashed border-slate-300">
                        <p className="text-slate-400">Belum ada data sensor yang masuk.</p>
                    </div>
                )}

                {dataLahan.map((lahan) => (
                    <div
                        key={lahan.lahanId}
                        className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-shadow duration-300"
                    >
                        <div className="bg-slate-800 p-4">
                            <h2 className="text-xl font-bold text-white flex justify-between items-center">
                                {lahan.lahanId}
                                <span className="text-xs font-normal opacity-70">
                                    {new Date(lahan.createdAt).toLocaleTimeString()}
                                </span>
                            </h2>
                        </div>
                        
                        <div className="p-6 space-y-6">
                            {/* Soil Moisture */}
                            <div>
                                <div className="flex justify-between items-end">
                                    <span className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Kelembapan Tanah</span>
                                    <span className={`text-2xl font-bold ${getStatusColor('moisture', lahan.soilMoisture)}`}>
                                        {lahan.soilMoisture}%
                                    </span>
                                </div>
                                <SimpleBar value={lahan.soilMoisture} max={100} color="bg-blue-500" />
                            </div>

                            {/* Temperature & pH Grid */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-orange-50 p-3 rounded-xl">
                                    <span className="text-xs font-bold text-orange-400 uppercase block mb-1">Suhu</span>
                                    <span className="text-xl font-bold text-orange-700">{lahan.temperature}°C</span>
                                </div>
                                <div className="bg-emerald-50 p-3 rounded-xl">
                                    <span className="text-xs font-bold text-emerald-400 uppercase block mb-1">pH Tanah</span>
                                    <span className="text-xl font-bold text-emerald-700">{lahan.ph}</span>
                                </div>
                            </div>

                            {/* Lux */}
                            <div className="pt-2 border-t border-slate-50">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-slate-500">Intensitas Cahaya</span>
                                    <span className="font-mono font-bold text-slate-700">{lahan.lux} Lux</span>
                                </div>
                            </div>
                        </div>
                        
                        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex justify-end">
                            <button className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors">
                                LIHAT HISTORY →
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default App;
