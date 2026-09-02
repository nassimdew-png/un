import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Database,
  Download,
  Trash2,
  HardDrive,
  RefreshCw,
  ShieldCheck,
  AlertTriangle,
  FileArchive,
  CheckCircle2,
  Clock,
  Zap,
  FolderArchive,
  Cloud,
  CloudUpload,
  Calendar,
  Server,
  Settings,
  Key,
  Globe,
  Check,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal
} from 'lucide-react';
import { apiRequest } from '../../api';

export default function DisasterRecoveryTab() {
  const { t } = useTranslation();
  const [backups, setBackups] = useState([]);
  const [totalSize, setTotalSize] = useState('0 MB');
  const [loading, setLoading] = useState(true);
  const [triggeringCloud, setTriggeringCloud] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // Cloud Config State
  const [showConfig, setShowConfig] = useState(false);
  const [cloudConfig, setCloudConfig] = useState({
    endpoint: '',
    bucket: 'clinic-saas-backups',
    access_key_id: '',
    secret_access_key: '',
    region: 'auto',
    is_configured: false,
    secret_key_configured: false,
  });
  const [savingConfig, setSavingConfig] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const fetchBackups = async () => {
    setLoading(true);
    try {
      const res = await apiRequest('/super-admin/backups/cloud-list');
      if (res.success) {
        setBackups(res.backups || []);
        if (res.backups && res.backups.length > 0) {
          const totalBytes = res.backups.reduce((acc, b) => acc + (b.size_bytes || 0), 0);
          setTotalSize(formatBytes(totalBytes));
        }
      }
    } catch (err) {
      console.error('Failed to load cloud backups:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCloudConfig = async () => {
    try {
      const res = await apiRequest('/super-admin/backups/cloud-config');
      if (res.success && res.config) {
        setCloudConfig({
          endpoint: res.config.endpoint || '',
          bucket: res.config.bucket || 'clinic-saas-backups',
          access_key_id: res.config.access_key_id || '',
          secret_access_key: res.config.secret_key_configured ? '••••••••••••••••' : '',
          region: res.config.region || 'auto',
          is_configured: res.config.is_configured,
          secret_key_configured: res.config.secret_key_configured,
        });
      }
    } catch (err) {
      console.error('Failed to load cloud config:', err);
    }
  };

  useEffect(() => {
    fetchBackups();
    fetchCloudConfig();
  }, []);

  const handleSaveConfig = async (e) => {
    e.preventDefault();
    setSavingConfig(true);
    setTestResult(null);
    try {
      const res = await apiRequest('/super-admin/backups/cloud-config', {
        method: 'POST',
        body: JSON.stringify(cloudConfig),
      });
      if (res.success) {
        setFeedback({ type: 'success', text: res.message || 'تم حفظ إعدادات السحابة بنجاح.' });
        fetchCloudConfig();
      } else {
        setFeedback({ type: 'error', text: res.message || 'فشل حفظ الإعدادات.' });
      }
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'فشل حفظ الإعدادات.' });
    } finally {
      setSavingConfig(false);
    }
  };

  const handleTestConnection = async () => {
    setTestingConnection(true);
    setTestResult(null);
    try {
      const res = await apiRequest('/super-admin/backups/test-cloud-connection', {
        method: 'POST',
      });
      setTestResult(res);
    } catch (err) {
      setTestResult({ success: false, message: err.message || 'فشل الاتصال بالسحابة.' });
    } finally {
      setTestingConnection(false);
    }
  };

  const handleTriggerCloudBackup = async () => {
    setTriggeringCloud(true);
    setFeedback(null);
    try {
      const res = await apiRequest('/super-admin/backups/trigger-cloud', {
        method: 'POST',
        body: JSON.stringify({ disk: cloudConfig.is_configured ? 'r2' : 'local' }),
      });
      if (res.success) {
        setFeedback({
          type: 'success',
          text: `تم إنشاء النسخة الاحتياطية وتأمينها بنجاح: ${res.latest_backup?.filename || ''} (${res.latest_backup?.size_mb || ''} MB)`,
        });
        fetchBackups();
      } else {
        setFeedback({ type: 'error', text: res.message || 'فشل إجراء النسخ الاحتياطي السحابي.' });
      }
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'فشل إجراء النسخ الاحتياطي.' });
    } finally {
      setTriggeringCloud(false);
    }
  };

  const handleDeleteBackup = async (filename) => {
    if (!window.confirm(`هل أنت متأكد من رغبتك في حذف ملف النسخة الاحتياطية (${filename})؟`)) return;

    try {
      const res = await apiRequest(`/super-admin/disaster-recovery/backups/${filename}`, {
        method: 'DELETE',
      });
      if (res.success) {
        fetchBackups();
      }
    } catch (err) {
      fetchBackups();
    }
  };

  return (
    <div className="space-y-6 text-right font-sans" dir="rtl">
      {/* Top Banner & Trigger Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-slate-900/60 p-6 rounded-3xl border border-slate-800 backdrop-blur-md shadow-2xl">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
              <Cloud className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-black text-white">محرك النسخ الاحتياطي السحابي والتعافي من الكوارث (S3 / R2 Cloud Engine)</h2>
          </div>
          <p className="text-xs text-slate-400">
            تأمين وتشفير كامل قواعد بيانات المنصة والعيادات وملفات المرضى بشكل سحابي مستقل مع تدوير آلي لمدة 30 يوماً.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setShowConfig(!showConfig)}
            className="px-4 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-teal-300 border border-slate-700 text-xs font-bold transition flex items-center gap-2"
          >
            <Settings className="w-4 h-4 text-teal-400" />
            <span>{showConfig ? 'إخفاء إعدادات السحابة' : '⚙️ إعدادات Cloudflare R2 / S3'}</span>
            {showConfig ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={handleTriggerCloudBackup}
            disabled={triggeringCloud}
            className="px-5 py-3 rounded-2xl bg-gradient-to-r from-teal-600 to-indigo-600 hover:from-teal-500 hover:to-indigo-500 text-white font-black text-xs shadow-lg shadow-teal-500/25 transition flex items-center gap-2 disabled:opacity-50"
          >
            {triggeringCloud ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CloudUpload className="w-4 h-4" />}
            <span>{triggeringCloud ? 'جاري النسخ والضغط والرفع...' : '☁️ إنشاء نسخة احتياطية سحابية فورية'}</span>
          </button>

          <button
            onClick={fetchBackups}
            className="p-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            title="تحديث الأرشيف"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Cloud Configuration Form (R2 / S3 Credentials) */}
      {showConfig && (
        <div className="p-6 rounded-3xl bg-slate-900 border border-teal-500/30 shadow-2xl space-y-5 animate-fade-in">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-teal-500/20 text-teal-300 flex items-center justify-center font-bold">
                <SlidersHorizontal className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-black text-white">إعدادات وبيانات الربط السحابي (Cloudflare R2 / AWS S3 Storage)</h3>
                <p className="text-[11px] text-slate-400">أدخل بيانات مفاتيح الوصول واسم الحاوية ليتم رفع النسخ الاحتياطية إليها تلقائياً</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-1 rounded-xl text-[10px] font-black border ${
                cloudConfig.is_configured 
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' 
                  : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
              }`}>
                {cloudConfig.is_configured ? '🟢 السحابة مربوطة ومفعلة' : '🟠 السحابة غير مهيأة بعد (حفظ محلي)'}
              </span>
            </div>
          </div>

          <form onSubmit={handleSaveConfig} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-300 font-bold mb-1">رابط نقطة النهاية (Endpoint URL):</label>
                <input
                  type="text"
                  required
                  placeholder="https://<account_id>.r2.cloudflarestorage.com"
                  value={cloudConfig.endpoint}
                  onChange={(e) => setCloudConfig({ ...cloudConfig, endpoint: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">اسم الحاوية (Bucket Name):</label>
                <input
                  type="text"
                  required
                  placeholder="clinic-saas-backups"
                  value={cloudConfig.bucket}
                  onChange={(e) => setCloudConfig({ ...cloudConfig, bucket: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:border-teal-500 font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-300 font-bold mb-1">معرّف مفتاح الوصول (Access Key ID):</label>
                <input
                  type="text"
                  required
                  placeholder="أدخل Access Key ID..."
                  value={cloudConfig.access_key_id}
                  onChange={(e) => setCloudConfig({ ...cloudConfig, access_key_id: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">المفتاح السري (Secret Access Key):</label>
                <input
                  type="password"
                  placeholder={cloudConfig.secret_key_configured ? '••••••••••••••••' : 'أدخل Secret Access Key...'}
                  value={cloudConfig.secret_access_key}
                  onChange={(e) => setCloudConfig({ ...cloudConfig, secret_access_key: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>

            {testResult && (
              <div className={`p-3.5 rounded-2xl border text-xs font-bold flex items-center gap-2 ${
                testResult.success 
                  ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40' 
                  : 'bg-red-950/80 text-red-300 border-red-500/40'
              }`}>
                <span>{testResult.message}</span>
              </div>
            )}

            <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-800/80">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={testingConnection}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-300 font-bold text-xs flex items-center gap-1.5 transition disabled:opacity-50"
              >
                {testingConnection ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                <span>{testingConnection ? 'جارٍ فحص الاتصال...' : '🧪 اختبار الاتصال بالسحابة'}</span>
              </button>

              <button
                type="submit"
                disabled={savingConfig}
                className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-slate-950 font-black text-xs shadow-md transition flex items-center gap-1.5 disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                <span>{savingConfig ? 'جارٍ الحفظ...' : '💾 حفظ إعدادات التخزين السحابي'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {feedback && (
        <div className={`p-4 rounded-2xl text-xs flex items-center gap-2 border ${
          feedback.type === 'success' ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
        }`}>
          {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> : <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
            <FolderArchive className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-slate-400">إجمالي الأرشيفات المتوفرة</div>
            <div className="text-lg font-black text-white font-mono">{backups.length} ملفات</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <HardDrive className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-slate-400">حجم التخزين المستهلك</div>
            <div className="text-lg font-black text-white font-mono">{totalSize}</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-slate-400">الجدولة الآلية والتدوير</div>
            <div className="text-xs font-black text-emerald-400 flex items-center gap-1">
              <span>نشطة (يومياً 02:00 ص - حذف بعد 30 يوم)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Backups Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl overflow-hidden backdrop-blur-md shadow-xl">
        <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-sm text-white">
            <FileArchive className="w-4 h-4 text-teal-400" />
            <span>سجل النسخ الاحتياطية لقواعد البيانات</span>
          </div>
          <div className="text-[11px] font-mono text-slate-500">
            الحالة: <span className="text-teal-400 font-bold">{cloudConfig.is_configured ? 'Cloudflare R2 / S3 Cloud' : 'Local & Cloud Storage'}</span>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-teal-400" />
            <div className="text-xs">جاري تحميل سجل النسخ السحابية...</div>
          </div>
        ) : backups.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <FolderArchive className="w-10 h-10 mx-auto mb-2 text-slate-700" />
            <div className="text-sm font-bold text-slate-400">لا توجد نسخ احتياطية محفوظة حالياً</div>
            <div className="text-xs text-slate-600 mt-1">انقر على الزر أعلاه لإنشاء نسخة سحابية فورية.</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-950/60 text-slate-400 text-[11px] border-b border-slate-800">
                <tr>
                  <th className="p-4 font-bold">اسم ملف الأرشيف</th>
                  <th className="p-4 font-bold">نوع النسخة</th>
                  <th className="p-4 font-bold">الحجم</th>
                  <th className="p-4 font-bold">تاريخ الإنشاء</th>
                  <th className="p-4 font-bold text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {backups.map((b, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/30 transition">
                    <td className="p-4 font-mono font-bold text-slate-200 flex items-center gap-2">
                      <Database className="w-4 h-4 text-teal-400 shrink-0" />
                      <span className="truncate max-w-xs sm:max-w-md">{b.filename}</span>
                    </td>
                    <td className="p-4">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30">
                        ☁️ قاعدة بيانات مضغوطة (.sql.gz)
                      </span>
                    </td>
                    <td className="p-4 font-mono font-bold text-teal-300">
                      {b.size_formatted}
                    </td>
                    <td className="p-4 text-slate-400 font-mono flex items-center gap-1.5 pt-5">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      <span>{b.created_at_human}</span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-2">
                        {b.download_url && (
                          <a
                            href={b.download_url}
                            target="_blank"
                            rel="noreferrer"
                            className="p-2 rounded-xl bg-teal-500/10 hover:bg-teal-500/20 text-teal-400 border border-teal-500/20 transition"
                            title="تحميل الأرشيف"
                          >
                            <Download className="w-4 h-4" />
                          </a>
                        )}
                        <button
                          onClick={() => handleDeleteBackup(b.filename)}
                          className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition"
                          title="حذف الأرشيف"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function formatBytes(bytes, decimals = 2) {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}
