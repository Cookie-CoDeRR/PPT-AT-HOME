import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Clock, Download, Presentation, Trash2 } from 'lucide-react';

export default function HistoryPanel({ onSelectHistory, onClose }) {
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

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-96 bg-white h-full shadow-2xl p-6 flex flex-col animate-in slide-in-from-right">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2 text-gray-800">
            <Clock className="w-5 h-5" />
            <h2 className="font-bold text-xl">Presentation History</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-800">&times;</button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3">
          {loading ? (
            <p className="text-gray-500 text-sm">Loading...</p>
          ) : history.length === 0 ? (
            <p className="text-gray-500 text-sm text-center mt-10">No history found.</p>
          ) : (
            history.map(item => (
              <div key={item.id} onClick={() => loadPres(item.id)} className="p-4 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50 cursor-pointer transition-colors group">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-gray-800 text-sm line-clamp-1">{item.title}</h3>
                    <p className="text-xs text-gray-500 mt-1">{new Date(item.created_at).toLocaleDateString()}</p>
                  </div>
                  <button onClick={(e) => deletePres(item.id, e)} className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
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
