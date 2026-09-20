import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Edit3,
  RotateCcw,
  CheckCircle2,
  Upload,
  Image as ImageIcon,
  ShieldCheck,
  Building2,
  Save,
  Trash2,
  Sparkles
} from 'lucide-react';

export default function DigitalSignaturePadModal({
  isOpen,
  onClose,
  onSaveSignature = null,
  initialLicense = '',
  initialName = ''
}) {
  if (!isOpen) return null;

  const canvasRef = useRef(null);
  const isDrawingRef = useRef(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [penColor, setPenColor] = useState('#1e40af'); // Classic Medical Blue
  const [stampImage, setStampImage] = useState(() => localStorage.getItem('clinic_practitioner_stamp') || null);
  const [licenseNumber, setLicenseNumber] = useState(() => localStorage.getItem('clinic_practitioner_license') || initialLicense || 'DZ-MSP-77492-MED');
  const [practitionerName, setPractitionerName] = useState(() => localStorage.getItem('clinic_practitioner_name') || initialName || '');
  const [activeTab, setActiveTab] = useState('draw'); // 'draw' | 'upload'

  // Initialize Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 2.5;

    // Load existing drawn signature if stored
    const existingSig = localStorage.getItem('clinic_practitioner_signature');
    if (existingSig) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        setHasDrawn(true);
      };
      img.src = existingSig;
    }
  }, [activeTab]);

  // Drawing Event Handlers
  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();

    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);

    ctx.strokeStyle = penColor;
    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
    isDrawingRef.current = true;
  };

  const draw = (e) => {
    if (!isDrawingRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();

    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);

    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
    setHasDrawn(true);
  };

  const stopDrawing = () => {
    isDrawingRef.current = false;
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  // Stamp file upload
  const handleStampUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const dataUrl = uploadEvent.target.result;
      setStampImage(dataUrl);
      localStorage.setItem('clinic_practitioner_stamp', dataUrl);
    };
    reader.readAsDataURL(file);
  };

  // Save Signature
  const handleSave = () => {
    let signatureDataUrl = null;
    const canvas = canvasRef.current;
    if (canvas && hasDrawn) {
      signatureDataUrl = canvas.toDataURL('image/png');
      localStorage.setItem('clinic_practitioner_signature', signatureDataUrl);
    }

    if (licenseNumber) {
      localStorage.setItem('clinic_practitioner_license', licenseNumber);
    }
    if (practitionerName) {
      localStorage.setItem('clinic_practitioner_name', practitionerName);
    }

    const payload = {
      signatureDataUrl: signatureDataUrl || localStorage.getItem('clinic_practitioner_signature'),
      stampImage: stampImage || localStorage.getItem('clinic_practitioner_stamp'),
      licenseNumber,
      practitionerName
    };

    if (onSaveSignature) {
      onSaveSignature(payload);
    }

    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md overflow-hidden animate-fadeIn"
      dir="rtl"
    >
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col">
        {/* HEADER */}
        <div className="px-6 py-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white">
                إعداد التوقيع الرقمي والختم المهني الرسمي
              </h3>
              <p className="text-[11px] text-slate-400">
                يُدمج تلقائياً في الحصائل الإكلينيكية، الشهادات الطبية، والتقارير الرسمية
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* BODY */}
        <div className="p-6 space-y-5 overflow-y-auto max-h-[75vh]">
          {/* Practitioner License & Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-slate-300 font-bold mb-1">
                اسم الأخصائي المعالج المعتمد:
              </label>
              <input
                type="text"
                value={practitionerName}
                onChange={(e) => setPractitionerName(e.target.value)}
                placeholder="د. / الأخصائي(ة)..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1">
                رقم الاعتماد المهني / رخصة الممارسة:
              </label>
              <input
                type="text"
                value={licenseNumber}
                onChange={(e) => setLicenseNumber(e.target.value)}
                placeholder="مثال: DZ-MSP-77492-CLINIC"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Tab Selector: Draw Signature vs Upload Stamp */}
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setActiveTab('draw')}
              className={`flex-1 py-2 rounded-lg font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'draw' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>1. رسم التوقيع اليدوي (Stylus / Touch)</span>
            </button>

            <button
              onClick={() => setActiveTab('upload')}
              className={`flex-1 py-2 rounded-lg font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'upload' ? 'bg-teal-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>2. الختم المهني للعيادة (Cachet)</span>
            </button>
          </div>

          {/* TAB 1: DRAW CANVAS */}
          {activeTab === 'draw' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">ارسم توقيعك في المربع أدناه:</span>
                <div className="flex items-center gap-2">
                  {/* Pen colors */}
                  <div className="flex items-center gap-1">
                    {['#1e40af', '#0f766e', '#0f172a'].map((color) => (
                      <button
                        key={color}
                        onClick={() => setPenColor(color)}
                        className={`w-4 h-4 rounded-full border ${
                          penColor === color ? 'border-white scale-125' : 'border-transparent'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>

                  <button
                    onClick={clearCanvas}
                    className="text-rose-400 hover:text-rose-300 text-[11px] flex items-center gap-1 transition-all"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>مسح</span>
                  </button>
                </div>
              </div>

              {/* Canvas Pad */}
              <div className="w-full h-40 bg-white rounded-2xl border-2 border-dashed border-slate-700 overflow-hidden relative shadow-inner cursor-crosshair">
                <canvas
                  ref={canvasRef}
                  width={500}
                  height={160}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                  className="w-full h-full block"
                />
                {!hasDrawn && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-slate-300 text-xs font-serif italic select-none">
                    ✍️ وقع هنا بالماوس، الإصبع، أو القلم الإلكتروني...
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: UPLOAD STAMP / CACHET */}
          {activeTab === 'upload' && (
            <div className="space-y-4">
              <label className="block text-xs font-bold text-slate-300">
                صورة الختم الرسمي للعيادة أو الأخصائي (خلفية شفافة PNG مستحسنة):
              </label>

              {stampImage ? (
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <div className="w-24 h-24 bg-white/10 rounded-xl p-2 flex items-center justify-center border border-slate-700">
                    <img
                      src={stampImage}
                      alt="الختم المهني"
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5">
                      <Upload className="w-3.5 h-3.5" />
                      <span>تغيير الختم</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleStampUpload}
                        className="hidden"
                      />
                    </label>
                    <button
                      onClick={() => {
                        setStampImage(null);
                        localStorage.removeItem('clinic_practitioner_stamp');
                      }}
                      className="px-3 py-1.5 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>حذف الختم</span>
                    </button>
                  </div>
                </div>
              ) : (
                <label className="p-8 rounded-2xl bg-slate-950 border-2 border-dashed border-slate-800 hover:border-indigo-500/50 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all">
                  <Upload className="w-8 h-8 text-slate-500" />
                  <span className="text-xs font-bold text-slate-300">انقر لرفع صورة الختم الرسمي</span>
                  <span className="text-[10px] text-slate-500">يدعم صيغ PNG, SVG, JPG (يفضل PNG مفرغ)</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleStampUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">
            تُحفظ البيانات محلياً وتُدرج تلقائياً في مستنداتك السريرية
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all"
            >
              إلغاء
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-teal-600 hover:from-indigo-500 hover:to-teal-500 text-white text-xs font-black shadow-lg shadow-indigo-600/20 transition-all flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>حفظ واعتماد التوقيع</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
