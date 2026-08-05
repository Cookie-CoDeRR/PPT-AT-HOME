import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Search, ArrowLeft, ExternalLink, LayoutGrid } from 'lucide-react';

// ─── Category Filter Tags ──────────────────────────────────────────────────────
const CATEGORIES = [
  'Company', 'Creative', 'Education', 'Reporting',
  'Project Management', 'Fundraising', 'Sales',
  'Marketing', 'Consulting', 'People', 'Strategy',
];

// ─── Static Template Data (replace with /api/templates once backend ready) ────
const WORKSPACE_TEMPLATES = [
  { id: 'w1', name: 'Sales Incentive Kickoff',              category: 'Sales',              thumb: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&q=80', dark: true  },
  { id: 'w2', name: 'Budget Review',                        category: 'Reporting',          thumb: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&q=80', dark: true  },
  { id: 'w3', name: 'Sleek Dark Slides for Corporate',      category: 'Company',            thumb: null,                                                                     dark: true  },
  { id: 'w4', name: 'Rich Purple Slides for Presentations', category: 'Creative',           thumb: null,                                                                     dark: true  },
  { id: 'w5', name: 'Social Media Strategy',                category: 'Marketing',          thumb: 'https://images.unsplash.com/photo-1432888498266-38ffec3eaf0a?w=400&q=80', dark: false },
  { id: 'w6', name: 'Quarterly Pipeline Review',            category: 'Sales',              thumb: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&q=80', dark: true  },
  { id: 'w7', name: 'Employee Handbook',                    category: 'People',             thumb: 'https://images.unsplash.com/photo-1521791136064-7986c2920216?w=400&q=80', dark: false },
  { id: 'w8', name: 'Handbook Highlights',                  category: 'People',             thumb: null,                                                                     dark: false },
  { id: 'w9', name: 'Project Post-Mortem',                  category: 'Project Management', thumb: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400&q=80', dark: true  },
  { id: 'w10',name: 'Goal Setting Framework',               category: 'Strategy',           thumb: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&q=80', dark: true  },
  { id: 'w11',name: 'Photography Portfolio',                category: 'Creative',           thumb: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&q=80', dark: false },
  { id: 'w12',name: 'Deep Blue Slides for Professional',    category: 'Company',            thumb: null,                                                                     dark: true  },
  { id: 'w13',name: 'Light & Modern Slides for Clean',      category: 'Creative',           thumb: null,                                                                     dark: false },
];

const TEMPLATES = [
  { id: 't1',  name: 'Best Practices Guide',           category: 'Company',            thumb: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=400&q=80', dark: true  },
  { id: 't2',  name: 'Process Documentation',          category: 'Reporting',          thumb: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80', dark: false },
  { id: 't3',  name: 'Experiment Report',              category: 'Education',          thumb: 'https://images.unsplash.com/photo-1530026405186-ed1f139313f8?w=400&q=80', dark: false },
  { id: 't4',  name: 'Training Program Overview',      category: 'Education',          thumb: null,                                                                       dark: false },
  { id: 't5',  name: 'How-To Guide',                   category: 'Education',          thumb: 'https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?w=400&q=80', dark: false },
  { id: 't6',  name: 'Lecture Plan',                   category: 'Education',          thumb: 'https://images.unsplash.com/photo-1494500764479-0c8f2919a3d8?w=400&q=80', dark: false },
  { id: 't7',  name: 'Training Overview',              category: 'Education',          thumb: null,                                                                       dark: false },
  { id: 't8',  name: 'Thesis Defense',                 category: 'Education',          thumb: null,                                                                       dark: false },
  { id: 't9',  name: 'Winning Your Scholarship',       category: 'Fundraising',        thumb: null,                                                                       dark: false },
  { id: 't10', name: 'Workshop Facilitation',          category: 'Consulting',         thumb: 'https://images.unsplash.com/photo-1467139701929-18c0d27a7516?w=400&q=80', dark: false },
  { id: 't11', name: 'Professional Process Review',    category: 'Reporting',          thumb: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400&q=80', dark: false },
  { id: 't12', name: 'Book Report',                    category: 'Education',          thumb: null,                                                                       dark: false },
  { id: 't13', name: 'Content Calendar',               category: 'Marketing',          thumb: 'https://images.unsplash.com/photo-1506784365847-bbad939e9335?w=400&q=80', dark: false },
  { id: 't14', name: 'Product Overview',               category: 'Sales',              thumb: null,                                                                       dark: true  },
  { id: 't15', name: 'Agency Capabilities',            category: 'Consulting',         thumb: null,                                                                       dark: true  },
  { id: 't16', name: 'Vibrant Dark Slides for Bold',   category: 'Creative',           thumb: null,                                                                       dark: true  },
  { id: 't17', name: 'Company Values',                 category: 'Company',            thumb: null,                                                                       dark: false },
  { id: 't18', name: 'Audit Report',                   category: 'Reporting',          thumb: null,                                                                       dark: true  },
  { id: 't19', name: 'Minimal Dark Slides for Clean',  category: 'Creative',           thumb: null,                                                                       dark: true  },
  { id: 't20', name: 'Startup Pitch',                  category: 'Company',            thumb: 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=400&q=80', dark: true  },
  { id: 't21', name: 'Bold Neon Slides for Creative',  category: 'Creative',           thumb: null,                                                                       dark: true  },
  { id: 't22', name: 'Dark & Dreamy Slides',           category: 'Creative',           thumb: null,                                                                       dark: true  },
  { id: 't23', name: 'Donor Update',                   category: 'Fundraising',        thumb: 'https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?w=400&q=80', dark: false },
  { id: 't24', name: 'Sales Teams Deal Overview',      category: 'Sales',              thumb: null,                                                                       dark: true  },
];

const SORT_OPTIONS = ['Recommended', 'Newest', 'Most used'];

// ─── Thumbnail Card ────────────────────────────────────────────────────────────
function TemplateCard({ template, onSelect }) {
  const [hovered, setHovered] = useState(false);
  const bg = template.dark
    ? 'bg-gradient-to-br from-gray-800 to-gray-900'
    : 'bg-gradient-to-br from-slate-100 to-blue-50';
  const textColor = template.dark ? 'text-white' : 'text-gray-800';

  return (
    <motion.div
      whileHover={{ y: -3, scale: 1.01 }}
      transition={{ duration: 0.15 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="cursor-pointer group"
      onClick={() => onSelect(template)}
    >
      <div className={`relative rounded-xl overflow-hidden aspect-[4/3] ${bg} border border-black/10 shadow-sm`}>
        {template.thumb ? (
          <img src={template.thumb} alt={template.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center p-4">
            <p className={`text-sm font-bold text-center leading-snug ${textColor} opacity-70`}>
              Lorem Ipsum Dolor Sit Amet
            </p>
          </div>
        )}
        {hovered && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <button className="px-4 py-2 bg-white text-gray-900 text-sm font-bold rounded-full shadow-lg hover:bg-gray-100 transition-colors">
              View template
            </button>
          </div>
        )}
      </div>
      <p className="mt-2 text-sm text-gray-700 font-medium leading-tight">{template.name}</p>
    </motion.div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function TemplatePicker({ onBack, onSelectTemplate }) {
  const [activeTab, setActiveTab] = useState('templates'); // 'workspace' | 'templates'
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState(null);
  const [sort, setSort] = useState('Recommended');

  const allTemplates = activeTab === 'workspace' ? WORKSPACE_TEMPLATES : TEMPLATES;

  const filtered = useMemo(() => {
    let list = allTemplates;
    if (activeCategory) list = list.filter(t => t.category === activeCategory);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(t => t.name.toLowerCase().includes(q) || t.category.toLowerCase().includes(q));
    }
    return list;
  }, [allTemplates, activeCategory, search]);

  return (
    <div className="w-full min-h-full bg-gradient-to-b from-[#e8eaf6] to-[#dde1f5] pb-20">

      {/* Top bar */}
      <div className="flex items-center justify-between px-8 py-4">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <button className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors">
          Manage templates <ExternalLink className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Title */}
      <div className="text-center pt-4 pb-6">
        <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Choose a template</h1>
      </div>

      {/* Tab + Search row */}
      <div className="max-w-5xl mx-auto px-6">
        {/* Tabs */}
        <div className="flex items-center gap-2 mb-4">
          <button
            onClick={() => setActiveTab('workspace')}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium border transition-all ${
              activeTab === 'workspace'
                ? 'bg-white border-gray-300 text-gray-900 shadow-sm'
                : 'bg-transparent border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" /> Workspace templates
          </button>
          <button
            onClick={() => setActiveTab('templates')}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium border transition-all ${
              activeTab === 'templates'
                ? 'bg-white border-gray-300 text-gray-900 shadow-sm'
                : 'bg-transparent border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" /> Templates
          </button>
        </div>

        {/* Search + Sort */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 flex-1 max-w-xs shadow-sm">
            <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search templates"
              className="text-sm text-gray-700 outline-none w-full bg-transparent placeholder-gray-400"
            />
          </div>
          <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm">
            Search
          </button>
          <div className="ml-auto">
            <select
              value={sort}
              onChange={e => setSort(e.target.value)}
              className="appearance-none bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 cursor-pointer outline-none shadow-sm"
            >
              {SORT_OPTIONS.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>

        {/* Category pill filters */}
        <div className="flex items-center gap-2 flex-wrap mb-6">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                activeCategory === cat
                  ? 'bg-blue-600 border-blue-600 text-white'
                  : 'bg-white/70 border-gray-200 text-gray-600 hover:bg-white hover:text-gray-900'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Template grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-lg font-medium">No templates found</p>
            <p className="text-sm mt-1">Try a different search or category</p>
          </div>
        ) : (
          <motion.div
            key={activeTab + activeCategory + search}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5"
          >
            {filtered.map(t => (
              <TemplateCard key={t.id} template={t} onSelect={onSelectTemplate} />
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}
