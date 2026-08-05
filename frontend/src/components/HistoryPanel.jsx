import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Clock, Download, Presentation, Trash2 } from 'lucide-react';

export default function HistoryPanel({ onSelectHistory, onClose, darkMode = true }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await axios.get('http://localhost:3000/api/history');
      setHistory(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadPres = async (id) => {
    try {
      const res = await axios.get(`http://localhost:3000/api/history/${id}`);
      onSelectHistory(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const deletePres = async (id, e) => {
    e.stopPropagation();
    try {
      await axios.delete(`http://localhost:3000/api/history/${id}`);
      fetchHistory();
    } catch (err) {
      console.error(err);
    }
  };

  const panelBg = darkMode ? 'bg-[#131B2A] border-l border-white/10 text-white' : 'bg-white border-l border-gray-200 text-gray-900';
  const cardBg = darkMode ? 'border-white/10 hover:border-violet-500/50 hover:bg-white/5' : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/70';
  const titleTxt = darkMode ? 'text-gray-100' : 'text-gray-900';
  const headerTxt = darkMode ? 'text-white' : 'text-gray-900';

  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative w-96 h-full shadow-2xl p-6 flex flex-col animate-in slide-in-from-right ${panelBg}`}>
        <div className="flex items-center justify-between mb-6">
          <div className={`flex items-center gap-2 ${headerTxt}`}>
            <Clock className="w-5 h-5 text-violet-500" />
            <h2 className="font-bold text-xl">Presentation History</h2>
          </div>
          <button onClick={onClose} className={darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'}>&times;</button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3">
          {loading ? (
            <p className="text-gray-400 text-sm">Loading...</p>
          ) : history.length === 0 ? (
            <p className="text-gray-400 text-sm text-center mt-10">No history found.</p>
          ) : (
            history.map(item => (
              <div key={item.id} onClick={() => loadPres(item.id)} className={`p-4 rounded-xl border cursor-pointer transition-colors group ${cardBg}`}>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className={`font-bold text-sm line-clamp-1 ${titleTxt}`}>{item.title}</h3>
                    <p className="text-xs text-gray-400 mt-1">{new Date(item.created_at).toLocaleDateString()}</p>
                  </div>
                  <button onClick={(e) => deletePres(item.id, e)} className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
