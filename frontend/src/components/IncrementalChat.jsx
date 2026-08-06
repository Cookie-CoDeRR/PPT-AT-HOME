import React, { useState } from 'react';
import { Send, Sparkles, Loader2 } from 'lucide-react';
import axios from 'axios';

export default function IncrementalChat({ slides, onAddSlide, contentConfig }) {
  const [instruction, setInstruction] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);

  const suggestions = [
    "+ Add Summary Slide",
    "+ Add Pros & Cons",
    "+ Add Case Study"
  ];

  const handleSubmit = async (text) => {
    const prompt = text || instruction;
    if (!prompt.trim()) return;
    
    setIsGenerating(true);
    setError(null);
    setInstruction('');

    try {
      const contextText = JSON.stringify(slides.map(s => ({
        slide: s.slide_number,
        title: s.title,
        type: s.slide_type || 'default'
      })), null, 2);

      const response = await axios.post('http://localhost:3000/api/generate-incremental', {
        contextText,
        instruction: prompt,
        contentConfig
      });

      if (response.data && response.data.slide) {
        const newSlide = response.data.slide;
        newSlide.slide_number = slides.length + 1;
        onAddSlide(newSlide);
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="mt-8 glass-panel p-4 flex flex-col gap-3 border-t-4 border-violet-500">
      <div className="flex gap-2">
        {suggestions.map((s, i) => (
          <button 
            key={i} 
            onClick={() => handleSubmit(s.replace('+ Add ', 'Add a slide for '))}
            disabled={isGenerating}
            className="text-xs px-3 py-1.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 text-gray-300 transition-colors disabled:opacity-50"
          >
            {s}
          </button>
        ))}
      </div>
      <div className="relative">
        <input 
          type="text" 
          value={instruction}
          onChange={e => setInstruction(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          disabled={isGenerating}
          placeholder="What should the next slide be about? (e.g., 'Include a timeline of deployment phases')"
          className="w-full bg-black/40 border border-white/10 rounded-xl pl-4 pr-12 py-3 text-sm outline-none focus:border-violet-500 transition-colors disabled:opacity-50 text-white placeholder-gray-500"
        />
        <button 
          onClick={() => handleSubmit()}
          disabled={isGenerating || (!instruction.trim() && !isGenerating)}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-violet-600 hover:bg-violet-500 rounded-lg disabled:opacity-50 transition-colors"
        >
          {isGenerating ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <Send className="w-4 h-4 text-white" />}
        </button>
      </div>
      {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
    </div>
  );
}
