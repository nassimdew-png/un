import React, { useState, useEffect } from 'react';
import { 
  BookOpen, Search, Plus, Filter, Sparkles, Layers, Eye, 
  Printer, Send, Play, CheckCircle2, User, Clock, Calendar, 
  Activity, Star, ChevronRight, X 
} from 'lucide-react';
import { therapyHubApi } from '../../api';
import PatientHomeworkBuilderModal from './PatientHomeworkBuilderModal';

export default function TherapyLibraryView({ tenant, user, patients = [] }) {
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeDifficulty, setActiveDifficulty] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modals
  const [previewExercise, setPreviewExercise] = useState(null);
  const [assigningExercise, setAssigningExercise] = useState(null);
  const [showBuilderModal, setShowBuilderModal] = useState(false);

  const fetchExercises = async () => {
    setLoading(true);
    try {
      const res = await therapyHubApi.getExercises({
        category: activeCategory,
        difficulty_level: activeDifficulty,
        search: searchTerm,
      });
      setExercises(res.exercises || []);
    } catch (err) {
      console.error('Error fetching therapy exercises:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExercises();
  }, [activeCategory, activeDifficulty, searchTerm]);

  const categories = [
    { id: 'all', label: 'جميع الأنشطة', icon: '🌟', count: exercises.length },
    { id: 'speech_articulation', label: 'النطق ومخارج الأصوات', icon: '🗣️' },
    { id: 'phonology', label: 'الوعي الفونولوجي', icon: '🔤' },
    { id: 'visual_perception', label: 'التمييز والإدراك البصري', icon: '👁️' },
    { id: 'fine_motor', label: 'الحركي الدقيق ومسك القلم', icon: '✍️' },
    { id: 'executive_attention', label: 'الانتباه والتركيز التنفيذي', icon: '🧠' },
    { id: 'cbt_behavioral', label: 'التعزيز السلوكي والمشاعر', icon: '⭐' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-white flex items-center space-x-2 space-x-reverse">
            <BookOpen className="w-5 h-5 text-emerald-400" />
            <span>بنك التمارين والواجبات المنزلية (Therapy & Homework Hub)</span>
          </h2>
          <p className="text-xs text-slate-400">
            مكتبة رقمية متكاملة للأنشطة العلاجية وبناء كراسات التدريب المنزلي القابلة للطباعة A4
          </p>
        </div>

        <button
          onClick={() => {
            setAssigningExercise(null);
            setShowBuilderModal(true);
          }}
          className="inline-flex items-center space-x-2 space-x-reverse px-5 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs shadow-lg shadow-emerald-500/25 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>➕ إنشاء كراس منزلي لمريض (Nouveau Cahier A4)</span>
        </button>
      </div>

      {/* Category Pills Bar */}
      <div className="glass-card rounded-2xl p-2 border border-slate-800 flex items-center space-x-2 space-x-reverse overflow-x-auto">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center space-x-1.5 space-x-reverse ${
              activeCategory === cat.id
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <span>{cat.icon}</span>
            <span>{cat.label}</span>
          </button>
        ))}
      </div>

      {/* Filters & Search Row */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center space-x-2 space-x-reverse w-full sm:w-auto">
          <span className="text-xs text-slate-400 font-bold">مستوى الصعوبة:</span>
          {['all', 'easy', 'medium', 'hard'].map((lvl) => (
            <button
              key={lvl}
              onClick={() => setActiveDifficulty(lvl)}
              className={`px-3 py-1 rounded-xl text-[11px] font-bold transition-all ${
                activeDifficulty === lvl
                  ? 'bg-slate-800 text-white border border-slate-700'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {lvl === 'all' ? 'الكل' : lvl === 'easy' ? 'سهل' : lvl === 'medium' ? 'متوسط' : 'متقدم'}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-500 absolute right-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="بحث في أسماء الأنشطة والمهارات..."
            className="w-full bg-slate-900 border border-slate-800 rounded-2xl pr-9 pl-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Exercise Cards Grid */}
      {loading ? (
        <div className="py-20 text-center text-slate-500 text-xs">
          جاري تحميل مكتبة الأنشطة والتمارين...
        </div>
      ) : exercises.length === 0 ? (
        <div className="glass-card rounded-3xl p-12 text-center border border-slate-800 space-y-3">
          <BookOpen className="w-10 h-10 text-slate-600 mx-auto" />
          <h4 className="text-sm font-bold text-white">لا توجد تمارين مطابقة لمعايير البحث</h4>
          <p className="text-xs text-slate-400">جرب تغيير التصنيف أو مسح نص البحث.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {exercises.map((ex) => (
            <div
              key={ex.id}
              className="glass-card rounded-3xl p-5 border border-slate-800/80 hover:border-emerald-500/40 shadow-xl transition-all flex flex-col justify-between space-y-4 group"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2.5 space-x-reverse">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold text-base">
                      {ex.category === 'speech_articulation' ? '🗣️' : ex.category === 'phonology' ? '🔤' : ex.category === 'visual_perception' ? '👁️' : ex.category === 'fine_motor' ? '✍️' : ex.category === 'executive_attention' ? '🧠' : '⭐'}
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-white group-hover:text-emerald-300 transition-colors">
                        {ex.title_ar}
                      </h4>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {ex.title_fr}
                      </span>
                    </div>
                  </div>

                  <span className={`px-2 py-0.5 rounded-md text-[9.5px] font-bold uppercase ${
                    ex.difficulty_level === 'easy'
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : ex.difficulty_level === 'medium'
                      ? 'bg-amber-500/20 text-amber-300'
                      : 'bg-rose-500/20 text-rose-300'
                  }`}>
                    {ex.difficulty_level === 'easy' ? 'سهل' : ex.difficulty_level === 'medium' ? 'متوسط' : 'متقدم'}
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] text-slate-300 space-y-1">
                  <div className="text-emerald-400 font-bold">
                    🎯 المهارة: <span className="text-slate-200 font-normal">{ex.target_skill}</span>
                  </div>
                  <div className="text-slate-400">
                    👶 الفئة العمرية: <span className="text-white font-mono">{ex.age_min} - {ex.age_max} سنوات</span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                  💡 {ex.instructions_parent_ar}
                </p>
              </div>

              {/* Card Footer Actions */}
              <div className="flex items-center space-x-2 space-x-reverse pt-2 border-t border-slate-800/60">
                <button
                  type="button"
                  onClick={() => setPreviewExercise(ex)}
                  className="flex-1 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold transition-all flex items-center justify-center space-x-1.5 space-x-reverse"
                >
                  <Eye className="w-3.5 h-3.5 text-slate-400" />
                  <span>معاينة النشاط</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setAssigningExercise(ex);
                    setShowBuilderModal(true);
                  }}
                  className="px-3 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/30 text-xs font-bold transition-all flex items-center space-x-1 space-x-reverse"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>إسناد</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Preview Activity Modal */}
      {previewExercise && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-3xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-black text-white flex items-center space-x-2 space-x-reverse">
                <span>{previewExercise.title_ar}</span>
                <span className="text-xs text-slate-400 font-normal">({previewExercise.title_fr})</span>
              </h3>
              <button
                onClick={() => setPreviewExercise(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
                <span className="font-bold text-emerald-400 block mb-1">🎯 الهدف والمهارة المستهدفة:</span>
                <p className="text-slate-200">{previewExercise.target_skill}</p>
              </div>

              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
                <span className="font-bold text-amber-400 block mb-1">💡 إرشادات التطبيق للأسرة:</span>
                <p className="text-slate-300 leading-relaxed">{previewExercise.instructions_parent_ar}</p>
              </div>

              {previewExercise.worksheet_assets && (
                <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
                  <span className="font-bold text-slate-400 block">📦 محتويات ورقة العمل (Assets):</span>
                  <div className="bg-slate-900 p-2.5 rounded-xl font-mono text-[11px] text-slate-300 max-h-40 overflow-y-auto">
                    <pre>{JSON.stringify(previewExercise.worksheet_assets, null, 2)}</pre>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end space-x-2 space-x-reverse pt-2">
              <button
                onClick={() => setPreviewExercise(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700"
              >
                إغلاق
              </button>
              <button
                onClick={() => {
                  setAssigningExercise(previewExercise);
                  setPreviewExercise(null);
                  setShowBuilderModal(true);
                }}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-lg shadow-emerald-500/25"
              >
                ➕ إسناد هذا النشاط لمريض
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Homework Builder Modal */}
      {showBuilderModal && (
        <PatientHomeworkBuilderModal
          isOpen={showBuilderModal}
          onClose={() => {
            setShowBuilderModal(false);
            setAssigningExercise(null);
          }}
          initialExercise={assigningExercise}
          onSuccess={() => {
            setShowBuilderModal(false);
            setAssigningExercise(null);
          }}
        />
      )}
    </div>
  );
}
