import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import {
  Home, Image, LayoutTemplate, BookOpen, Settings, MoreHorizontal,
  Search, Users, Globe, Code2, Trash2, FolderPlus, Plus, Download,
  ChevronDown, Grid3X3, List, Star, Clock, User, Edit3, MoreVertical,
  Sparkles, Presentation, SortDesc, Scissors
} from 'lucide-react';
import MediaLibrary from './MediaLibrary';
import SearchModal from './SearchModal';
import NewGammaModal from './NewGammaModal';
import SlideRenderer from './SlideRenderer';

// ─── Sidebar nav items ──────────────────────────────────────────────────────
const SIDE_NAV = [
  { icon: Home,           label: 'Home',      id: 'home'      },
  { icon: Image,          label: 'Media',     id: 'media'     },
  { icon: LayoutTemplate, label: 'Templates', id: 'templates' },
  { icon: BookOpen,       label: 'Library',   id: 'library'   },
  { icon: Settings,       label: 'Settings',  id: 'settings'  },
  { icon: MoreHorizontal, label: 'More',      id: 'more'      },
];

const FILTER_TABS = [
  { id: 'all',      label: 'All',              icon: Grid3X3 },
  { id: 'recent',   label: 'Recently viewed',  icon: Clock   },
  { id: 'mine',     label: 'Created by you',   icon: User    },
  { id: 'fav',      label: 'Favorites',        icon: Star    },
];

// ─── Document Card ──────────────────────────────────────────────────────────
function DocCard({ item, darkMode, onAction }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);

  const date = item.created_at
    ? new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : 'Unknown date';

  const cardBg  = darkMode ? 'bg-[#1A2235] border-white/10 hover:border-white/20' : 'bg-white border-gray-200 hover:border-gray-300';
  const titleC  = darkMode ? 'text-gray-200' : 'text-gray-800';
  const dateC   = darkMode ? 'text-gray-500' : 'text-gray-400';
  const thumbBg = darkMode ? 'bg-[#131B2A]' : 'bg-gray-50';
  const menuBg  = darkMode ? 'bg-[#1E2A3B] border-white/10' : 'bg-white border-gray-200';
  const menuTxt = darkMode ? 'text-gray-300 hover:text-white hover:bg-white/5' : 'text-gray-700 hover:bg-gray-50';

  const slides = item.slides_json?.slides || item.slides_json || [];
  const presentationTheme = item.slides_json?.theme;

  // Auto scroll logic on hover
  useEffect(() => {
    let interval;
    if (isHovered && slides.length > 1) {
      interval = setInterval(() => {
        setPreviewIndex(prev => (prev + 1) % slides.length);
      }, 1500);
    } else if (!isHovered) {
      setPreviewIndex(0);
    }
    return () => clearInterval(interval);
  }, [isHovered, slides.length]);

  return (
    <motion.div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.15 }}
      className={`relative rounded-xl border overflow-hidden cursor-pointer transition-all duration-200 group ${cardBg}`}
    >
      {/* Thumbnail */}
      <div className={`aspect-[4/3] ${thumbBg} flex items-center justify-center relative overflow-hidden`}>
        {slides.length > 0 ? (
          <div className="absolute inset-0">
            <div 
              style={{ width: '800px', height: '600px', transform: 'scale(0.35)', transformOrigin: 'top left' }}
              className="pointer-events-none"
            >
               <SlideRenderer slide={slides[previewIndex]} theme={presentationTheme} />
            </div>
            {/* Arrows when hovered */}
            {slides.length > 1 && (
              <div className="absolute bottom-2 left-0 right-0 flex justify-center items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-auto">
                <button 
                  onClick={(e) => { e.stopPropagation(); setPreviewIndex(p => (p - 1 + slides.length) % slides.length); }}
                  className="bg-black/60 text-white rounded-full p-1 hover:bg-black/90 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
                </button>
                <div className="flex items-center gap-1.5">
                  {slides.map((_, idx) => (
                    <div key={idx} className={`h-1.5 w-1.5 rounded-full transition-colors duration-300 ${idx === previewIndex ? 'bg-white scale-125' : 'bg-white/40'}`} />
                  ))}
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); setPreviewIndex(p => (p + 1) % slides.length); }}
                  className="bg-black/60 text-white rounded-full p-1 hover:bg-black/90 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500/30 to-fuchsia-500/30 flex items-center justify-center pointer-events-none">
            <Presentation className="w-7 h-7 text-violet-400/70" />
          </div>
        )}
        
        {/* Hover star */}
        <button className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded z-20 pointer-events-auto">
          <Star className={`w-4 h-4 ${darkMode ? 'text-gray-500 hover:text-yellow-400' : 'text-gray-400 hover:text-yellow-500'}`} />
        </button>
      </div>

      {/* Card footer */}
      <div className="px-3 py-2.5 flex items-center gap-2">
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-semibold truncate ${titleC}`}>{item.title || 'Untitled'}</p>
          <p className={`text-xs mt-0.5 ${dateC}`}>Edited {date}</p>
        </div>

        {/* More menu */}
        <div className="relative">
          <button
            onClick={e => { e.stopPropagation(); setMenuOpen(o => !o); }}
            className={`p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity ${darkMode ? 'hover:bg-white/10 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
          >
            <MoreVertical className="w-4 h-4" />
          </button>
          <AnimatePresence>
            {menuOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className={`absolute bottom-8 right-0 z-30 rounded-xl border shadow-2xl py-1 min-w-[140px] text-sm ${menuBg}`}
              >
                {['Open', 'Rename', 'Duplicate', 'Delete'].map(opt => (
                  <button key={opt} onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onAction(opt, item); }}
                    className={`w-full text-left px-3 py-1.5 transition-colors ${menuTxt} ${opt === 'Delete' ? 'text-red-400' : ''}`}>
                    {opt}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function HomePage({ onCreateNew, onSelectMode, onShowHistory, onOpenDocument, darkMode }) {
  const [activeNav,    setActiveNav]    = useState('home');
  const [activeFilter, setActiveFilter] = useState('all');
  const [viewMode,     setViewMode]     = useState('grid');   // 'grid' | 'list'
  const [searchQuery,  setSearchQuery]  = useState('');
  const [docs,         setDocs]         = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [importOpen,   setImportOpen]   = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [newGammaOpen,    setNewGammaOpen]    = useState(false); // Only open on button click

  // Global hotkey for Cmd+K to open New Gamma Modal as requested
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setNewGammaOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Fetch history from existing backend endpoint
  useEffect(() => {
    axios.get('http://localhost:3000/api/history')
      .then(res => setDocs(Array.isArray(res.data) ? res.data : []))
      .catch(() => setDocs([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = docs.filter(d =>
    !searchQuery || (d.title || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAction = async (opt, item) => {
    try {
      if (opt === 'Open') {
        const res = await axios.get(`http://localhost:3000/api/history/${item.id}`);
        if (onOpenDocument) onOpenDocument(res.data);
      } else if (opt === 'Delete') {
        if (!window.confirm('Are you sure you want to delete this?')) return;
        await axios.delete(`http://localhost:3000/api/history/${item.id}`);
        setDocs(docs.filter(d => d.id !== item.id));
      } else if (opt === 'Rename') {
        const newTitle = window.prompt('Enter new title:', item.title);
        if (newTitle && newTitle.trim()) {
          await axios.put(`http://localhost:3000/api/history/${item.id}`, { title: newTitle.trim() });
          setDocs(docs.map(d => d.id === item.id ? { ...d, title: newTitle.trim() } : d));
        }
      } else if (opt === 'Duplicate') {
        const res = await axios.post(`http://localhost:3000/api/history/${item.id}/duplicate`);
        setDocs([res.data, ...docs]);
      }
    } catch (e) {
      console.error(e);
      window.alert('Action failed');
    }
  };

  // ── Theme tokens ──────────────────────────────────────────────────────────
  const sidebarBg  = darkMode ? 'bg-[#0D1117] border-white/5'  : 'bg-gray-50 border-gray-200';
  const panelBg    = darkMode ? 'bg-[#111827] border-white/5'  : 'bg-white border-gray-100';
  const mainBg     = darkMode ? ''                             : '';
  const headerTxt  = darkMode ? 'text-white'                  : 'text-gray-900';
  const mutedTxt   = darkMode ? 'text-gray-400'               : 'text-gray-500';
  const inputBg    = darkMode ? 'bg-white/5 border-white/10 text-gray-300 placeholder-gray-600' : 'bg-gray-100 border-gray-200 text-gray-700 placeholder-gray-400';
  const navItemAct = darkMode ? 'bg-white/10 text-white'      : 'bg-gray-200 text-gray-900';
  const navItemDef = darkMode ? 'text-gray-500 hover:text-gray-300 hover:bg-white/5' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100';
  const tabAct     = darkMode ? 'bg-white/10 text-white'      : 'bg-blue-50 text-blue-700';
  const tabDef     = darkMode ? 'text-gray-500 hover:text-gray-300' : 'text-gray-500 hover:text-gray-800';
  const divider    = darkMode ? 'border-white/5'              : 'border-gray-100';
  const sideLink   = darkMode ? 'text-gray-400 hover:text-gray-200 hover:bg-white/5' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100';

  return (
    <div className={`flex w-full h-full`}>

      {/* ── Far-left icon sidebar ─────────────────────────────────────────── */}
      <div className={`flex flex-col items-center py-3 gap-1 w-14 border-r flex-shrink-0 ${sidebarBg}`}>
        {/* Logo */}
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-md mb-3">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        {SIDE_NAV.map(item => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              title={item.label}
              onClick={() => setActiveNav(item.id)}
              className={`flex flex-col items-center gap-0.5 w-10 py-2 rounded-lg text-[9px] font-medium transition-all ${activeNav === item.id ? navItemAct : navItemDef}`}
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── Secondary sidebar ─────────────────────────────────────────────── */}
      <div className={`flex flex-col w-52 flex-shrink-0 border-r ${panelBg}`}>
        {/* Conditionally render secondary sidebar based on activeNav */}
        {activeNav === 'home' && (
          <>
            {/* Workspace */}
            <div className={`px-3 py-3 border-b ${divider}`}>
              <button className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm font-semibold transition-colors ${sideLink}`}>
                <div className="w-6 h-6 rounded bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white text-[10px] font-bold">AW</div>
                <span className={`flex-1 text-left text-xs truncate ${headerTxt}`}>My Workspace</span>
                <ChevronDown className={`w-3 h-3 ${mutedTxt}`} />
              </button>
            </div>

            {/* Nav links */}
            <div className={`px-2 py-2 space-y-0.5 border-b ${divider}`}>
              <p className={`text-[10px] font-bold uppercase tracking-widest px-2 mb-1 ${mutedTxt}`}>Gammas</p>
              {[
                { icon: Plus,    label: 'New Gamma ⌘K', onClick: () => setNewGammaOpen(true) },
                { icon: Search,  label: 'Search', onClick: () => setSearchModalOpen(true) },
                { icon: Users,   label: 'Shared with you' },
                { icon: Globe,   label: 'Sites' },
                { icon: Code2,   label: 'API Generated' },
              ].map(item => {
                const Icon = item.icon;
                return (
                  <button 
                    key={item.label} 
                    onClick={item.onClick}
                    className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs transition-colors ${sideLink}`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {item.label}
                  </button>
                );
              })}
            </div>

            {/* Folders */}
            <div className="px-2 py-2 flex-1">
              <p className={`text-[10px] font-bold uppercase tracking-widest px-2 mb-2 ${mutedTxt}`}>Folders</p>
              <div className={`mx-2 p-3 rounded-xl ${darkMode ? 'bg-white/5' : 'bg-gray-50'}`}>
                <p className={`text-xs ${mutedTxt} mb-1.5 leading-snug`}>Organize your gammas by topic and share them with your team</p>
                <button className="text-xs text-blue-500 hover:text-blue-400 font-medium">Create or join a folder</button>
              </div>
            </div>

            {/* Trash */}
            <div className={`px-2 py-2 border-t ${divider}`}>
              <button className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs transition-colors ${sideLink}`}>
                <Trash2 className="w-3.5 h-3.5" /> Trash
              </button>
            </div>
          </>
        )}

        {activeNav === 'media' && (
          <>
            <div className={`px-4 py-4 border-b ${divider}`}>
              <h2 className={`text-sm font-bold ${headerTxt}`}>Media Library</h2>
            </div>
            <div className="px-2 py-2 space-y-0.5 flex-1">
              <button className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs font-semibold ${darkMode ? 'bg-white/10 text-white' : 'bg-gray-200 text-gray-900'}`}>
                <Image className="w-3.5 h-3.5" /> Media
              </button>
              <button className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs transition-colors ${sideLink}`}>
                <Scissors className="w-3.5 h-3.5" /> Graphics
              </button>
            </div>
          </>
        )}
      </div>

      {/* ── Main content ──────────────────────────────────────────────────── */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        
        {activeNav === 'media' ? (
          <MediaLibrary darkMode={darkMode} />
        ) : (
          <div className="flex flex-col h-full overflow-y-auto">
            {/* Top bar */}
            <div className={`flex items-center gap-3 px-6 py-3 border-b flex-shrink-0 ${darkMode ? 'border-white/5' : 'border-gray-100'}`}>
              <div className="flex items-center gap-2 flex-1">
                <Grid3X3 className={`w-4 h-4 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                <span className={`font-bold text-base ${headerTxt}`}>Gammas</span>
              </div>

              {/* Search */}
              <div className={`hidden md:flex items-center gap-2 rounded-lg px-3 py-1.5 border text-sm flex-1 max-w-xs ${inputBg}`}>
                <Search className="w-4 h-4 flex-shrink-0 opacity-60" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search..."
                  className="bg-transparent outline-none flex-1 text-sm"
                />
              </div>

              {/* Right icons */}
              <div className="flex items-center gap-2">
                <button className={`p-1.5 rounded-lg transition-colors ${navItemDef}`} title="Notifications">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                </button>
              </div>
            </div>

            {/* Action bar */}
            <div className="flex items-center gap-2 px-6 py-4 flex-shrink-0">
              {/* ⭐ CREATE NEW button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={onCreateNew}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white font-bold text-sm shadow-lg shadow-blue-500/20 transition-all"
              >
                <Plus className="w-4 h-4" />
                Create new
                <span className="ml-1 px-1.5 py-0.5 bg-white/20 rounded-md text-[10px] font-bold tracking-wide">AI</span>
              </motion.button>

              {/* New gamma dropdown */}
              <button 
                onClick={() => setNewGammaOpen(true)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium border transition-colors ${darkMode ? 'border-white/10 text-gray-300 hover:bg-white/5' : 'border-gray-200 text-gray-700 hover:bg-gray-50'}`}
              >
                <Plus className="w-3.5 h-3.5" />
                New gamma
                <ChevronDown className="w-3.5 h-3.5 opacity-60" />
              </button>

              {/* Import dropdown */}
              <div className="relative">
                <button
                  onClick={() => setImportOpen(o => !o)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium border transition-colors ${darkMode ? 'border-white/10 text-gray-300 hover:bg-white/5' : 'border-gray-200 text-gray-700 hover:bg-gray-50'}`}
                >
                  <Download className="w-3.5 h-3.5" />
                  Import
                  <ChevronDown className="w-3.5 h-3.5 opacity-60" />
                </button>
                <AnimatePresence>
                  {importOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      className={`absolute top-11 left-0 z-30 rounded-xl border shadow-2xl py-1 min-w-[180px] text-sm ${darkMode ? 'bg-[#1A2235] border-white/10' : 'bg-white border-gray-200'}`}
                    >
                      {['Upload a file', 'Import from URL', 'Import from Drive'].map(opt => (
                        <button
                          key={opt}
                          onClick={() => { setImportOpen(false); onSelectMode('import'); }}
                          className={`w-full text-left px-3 py-2 transition-colors ${darkMode ? 'text-gray-300 hover:bg-white/5 hover:text-white' : 'text-gray-700 hover:bg-gray-50'}`}
                        >
                          {opt}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Filter tabs + sort/view toggle */}
            <div className={`flex items-center justify-between px-6 pb-3 flex-shrink-0`}>
              <div className="flex items-center gap-1">
                {FILTER_TABS.map(tab => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveFilter(tab.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${activeFilter === tab.id ? tabAct : tabDef}`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center gap-2">
                {/* Sort */}
                <button className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${mutedTxt} hover:text-current`}>
                  <SortDesc className="w-3.5 h-3.5" /> Last edited
                  <ChevronDown className="w-3 h-3" />
                </button>
                <div className={`w-px h-4 ${darkMode ? 'bg-white/10' : 'bg-gray-200'}`} />
                {/* Grid / List toggle */}
                <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded transition-colors ${viewMode === 'grid' ? (darkMode ? 'bg-white/10 text-white' : 'bg-gray-200 text-gray-900') : mutedTxt}`}><Grid3X3 className="w-3.5 h-3.5" /></button>
                <button onClick={() => setViewMode('list')} className={`p-1.5 rounded transition-colors ${viewMode === 'list' ? (darkMode ? 'bg-white/10 text-white' : 'bg-gray-200 text-gray-900') : mutedTxt}`}><List className="w-3.5 h-3.5" /></button>
              </div>
            </div>

            {/* Document grid */}
            <div className="flex-1 px-6 pb-10">
              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <div className="w-6 h-6 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : filtered.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center justify-center py-24 text-center"
                >
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 flex items-center justify-center mb-4">
                    <Presentation className="w-8 h-8 text-violet-400/60" />
                  </div>
                  <p className={`text-lg font-semibold mb-1 ${headerTxt}`}>No presentations yet</p>
                  <p className={`text-sm mb-5 ${mutedTxt}`}>Create your first AI-powered presentation</p>
                  <button
                    onClick={onCreateNew}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 text-white font-bold text-sm shadow-lg"
                  >
                    <Plus className="w-4 h-4" /> Create new
                  </button>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={viewMode === 'grid'
                    ? 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4'
                    : 'flex flex-col gap-2'
                  }
                >
                  {filtered.map(doc => (
                    <DocCard key={doc.id} item={doc} darkMode={darkMode} onAction={handleAction} />
                  ))}
                </motion.div>
              )}
            </div>
          </div>
        )}
      </div>

      <SearchModal 
        isOpen={searchModalOpen} 
        onClose={() => setSearchModalOpen(false)} 
        docs={docs} 
        darkMode={darkMode} 
      />

      <NewGammaModal 
        isOpen={newGammaOpen}
        onClose={() => setNewGammaOpen(false)}
        darkMode={darkMode}
        onSelectBlank={(layoutId, typeId) => {
           // Transition seamlessly to create-new wizard
           onCreateNew();
        }}
      />
    </div>
  );
}
