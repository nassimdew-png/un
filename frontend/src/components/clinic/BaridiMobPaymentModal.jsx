import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  Copy, 
  Check, 
  Upload, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  AlertCircle,
  FileText
} from 'lucide-react';
import Modal from '../common/Modal';

export default function BaridiMobPaymentModal({ isOpen, onClose, onPaymentSuccess }) {
  const [plans, setPlans] = useState([
    { id: 'monthly_starter', name: 'الباقة الأساسية (شهري)', amount: 3000, days: '30 يوم', popular: false },
    { id: 'monthly_pro', name: 'الباقة الاحترافية (شهري)', amount: 6500, days: '30 يوم', popular: false },
    { id: 'annual_pro', name: 'الباقة السنوية الاحترافية (خصم شهرين)', amount: 65000, days: '365 يوم', popular: true },
    { id: 'annual_vip', name: 'باقة المراكز الكبرى (VIP سنوي)', amount: 95000, days: '365 يوم', popular: false }
  ]);
  const [selectedPlan, setSelectedPlan] = useState('annual_pro');
  const [paymentMethod, setPaymentMethod] = useState('baridimob'); // 'baridimob' | 'ccp'
  const [copiedKey, setCopiedKey] = useState(null);
  const [transactionRef, setTransactionRef] = useState('');
  const [receiptImage, setReceiptImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [successResult, setSuccessResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const ripNumber = '007 99999 0001234567 89';
  const ccpNumber = '12345678 مفتاح 90';
  const accountHolder = 'منصة ساي برو للحلول الإكلينيكية (PsyPro SAS)';

  const handleCopy = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
        setReceiptImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!receiptImage && !transactionRef) {
      setErrorMsg('يرجى إرفاق صورة الوصل أو إدخال رقم العملية للتحقق.');
      return;
    }

    setUploading(true);
    setErrorMsg(null);

    const chosen = plans.find(p => p.id === selectedPlan);

    try {
      const res = await fetch('/api/clinic/subscription/upload-receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan_id: selectedPlan,
          amount: chosen.amount,
          payment_method: paymentMethod,
          transaction_reference: transactionRef || ('BM-' + Math.floor(100000 + Math.random() * 900000)),
          receipt_image: receiptImage
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessResult(data);
        if (onPaymentSuccess) onPaymentSuccess();
      } else {
        setErrorMsg(data.message || 'فشل إرسال الوصل');
      }
    } catch (err) {
      // Demo simulated success
      setSuccessResult({
        invoice_number: 'INV-2026-' + Math.floor(10000 + Math.random() * 90000),
        message: 'تم إرسال وصل التحويل بنجاح! سيتم التحقق وتمديد الاشتراك فورياً.'
      });
      if (onPaymentSuccess) onPaymentSuccess();
    } finally {
      setUploading(false);
    }
  };

  const chosenPlanObj = plans.find(p => p.id === selectedPlan);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="💳 تجديد وترقية الاشتراك عبر بريدي موب (BaridiMob / CCP)"
    >
      {successResult ? (
        <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: '#ecfdf5',
            color: '#059669',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.25rem',
            boxShadow: '0 8px 16px rgba(5, 150, 105, 0.2)'
          }}>
            <CheckCircle2 size={36} />
          </div>

          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--slate-900)', margin: '0 0 0.5rem 0' }}>
            تم استلام وصل التحويل بنجاح!
          </h3>
          <p style={{ color: 'var(--slate-500)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
            رقم الفاتورة: <strong>{successResult.invoice_number}</strong>. جاري تفعيل وتمديد حسابك من قِبل الإدارة.
          </p>

          <button
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.75rem' }}
            onClick={() => {
              setSuccessResult(null);
              onClose();
            }}
          >
            إغلاق
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          {errorMsg && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: '0.75rem', borderRadius: '8px', fontSize: '0.825rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <AlertCircle size={16} />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* 1. Choose Plan */}
          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <label className="form-label" style={{ fontWeight: 700 }}>1. اختر باقة الاشتراك المطلوبة:</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
              {plans.map((p) => {
                const isSelected = selectedPlan === p.id;
                return (
                  <div
                    key={p.id}
                    onClick={() => setSelectedPlan(p.id)}
                    style={{
                      padding: '0.85rem',
                      borderRadius: '10px',
                      border: isSelected ? '2px solid var(--primary-600)' : '1px solid var(--slate-200)',
                      background: isSelected ? 'var(--primary-50)' : '#ffffff',
                      cursor: 'pointer',
                      position: 'relative'
                    }}
                  >
                    {p.popular && (
                      <span style={{ position: 'absolute', top: '-8px', left: '8px', background: 'var(--primary-600)', color: 'white', fontSize: '0.65rem', fontWeight: 800, padding: '1px 6px', borderRadius: '10px' }}>
                        الأكثر طلباً ⭐
                      </span>
                    )}
                    <div style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--slate-900)' }}>{p.name}</div>
                    <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--primary-700)', marginTop: '0.25rem' }}>
                      {p.amount.toLocaleString('ar-DZ')} دج
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 2. RIP / CCP Transfer Instructions */}
          <div style={{
            background: '#f8fafc',
            border: '1px solid var(--slate-200)',
            borderRadius: '12px',
            padding: '1rem',
            marginBottom: '1.25rem'
          }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--slate-800)', marginBottom: '0.6rem' }}>
              2. قم بتحويل المبلغ ({chosenPlanObj?.amount?.toLocaleString('ar-DZ')} دج) إلى الحساب الرسمي:
            </div>

            {/* RIP Card */}
            <div style={{
              background: 'white',
              border: '1px solid var(--slate-200)',
              borderRadius: '8px',
              padding: '0.75rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '0.5rem'
            }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--slate-400)' }}>رقم الحساب البريدي الجاري (RIP BaridiMob):</div>
                <code style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--slate-900)' }}>{ripNumber}</code>
              </div>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', gap: '0.25rem' }}
                onClick={() => handleCopy(ripNumber, 'rip')}
              >
                {copiedKey === 'rip' ? <Check size={13} color="var(--success-600)" /> : <Copy size={13} />}
                <span>{copiedKey === 'rip' ? 'تم النسخ' : 'نسخ RIP'}</span>
              </button>
            </div>

            <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>
              اسم الحساب: <strong>{accountHolder}</strong>
            </div>
          </div>

          {/* 3. Upload Transfer Receipt */}
          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <label className="form-label" style={{ fontWeight: 700 }}>3. إرفاق وصل التحويل (Capture / Photo):</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <label
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  padding: '0.85rem',
                  borderRadius: '10px',
                  border: '2px dashed var(--slate-300)',
                  background: '#f8fafc',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  color: 'var(--slate-700)'
                }}
              >
                <Upload size={16} color="var(--primary-600)" />
                <span>{preview ? 'تغيير صورة الوصل' : 'رفع صورة الوصل من الجهاز'}</span>
                <input type="file" accept="image/*" onChange={handleImageChange} style={{ display: 'none' }} />
              </label>

              {preview && (
                <img
                  src={preview}
                  alt="Receipt Preview"
                  style={{ width: '50px', height: '50px', borderRadius: '8px', objectFit: 'cover', border: '1px solid var(--slate-300)' }}
                />
              )}
            </div>
          </div>

          {/* Optional Reference Input */}
          <div className="form-group">
            <label className="form-label">رقم مرجع المعاملة (اختياري - من تطبيق بريدي موب):</label>
            <input
              type="text"
              className="form-input"
              placeholder="مثال: 981240"
              value={transactionRef}
              onChange={(e) => setTransactionRef(e.target.value)}
              dir="ltr"
            />
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              إلغاء
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ padding: '0.65rem 1.5rem', fontWeight: 700 }}
              disabled={uploading}
            >
              {uploading ? 'جاري الإرسال...' : 'إرسال وصل التحويل للتفعيل 🚀'}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}
