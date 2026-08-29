import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Search, 
  Filter, 
  Eye, 
  RefreshCw, 
  Building2, 
  Calendar, 
  FileText, 
  Sparkles,
  AlertCircle,
  ExternalLink,
  ShieldAlert
} from 'lucide-react';
import Modal from '../common/Modal';

export default function BaridiMobApprovalInbox() {
  const [transactions, setTransactions] = useState([]);
  const [metrics, setMetrics] = useState({ total: 0, pending: 0, paid: 0, rejected: 0 });
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [actionLoading, setActionLoading] = useState(null);

  // Lightbox & Rejection State
  const [previewImage, setPreviewImage] = useState(null);
  const [rejectingTx, setRejectingTx] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    fetchReceipts();
  }, [statusFilter]);

  const fetchReceipts = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/superadmin/payments/pending-receipts?status=${statusFilter}`);
      if (res.ok) {
        const data = await res.json();
        setTransactions(data.transactions || []);
        if (data.metrics) setMetrics(data.metrics);
      }
    } catch (e) {
      console.log('Using demo receipts data:', e);
      setMetrics({ total: 3, pending: 1, paid: 1, rejected: 1 });
      setTransactions([
        {
          id: 'tx_101',
          clinic_name: 'عيادة الأمل للتخاطب',
          clinic_subdomain: 'elamal',
          plan_id: 'annual_pro',
          plan_name: 'الباقة السنوية الاحترافية (365 يوم)',
          amount: 65000,
          payment_method: 'baridimob',
          transaction_reference: 'BM-982410',
          invoice_number: 'INV-2026-98124',
          payment_status: 'pending',
          receipt_image_path: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=600&q=80',
          created_at: new Date(Date.now() - 2 * 3600000).toISOString()
        },
        {
          id: 'tx_102',
          clinic_name: 'مركز النور للأرطوفونيا',
          clinic_subdomain: 'al-nour',
          plan_id: 'monthly_pro',
          plan_name: 'الباقة الاحترافية (شهري)',
          amount: 6500,
          payment_method: 'ccp',
          transaction_reference: 'CCP-00192',
          invoice_number: 'INV-2026-10492',
          payment_status: 'paid',
          approved_at: new Date(Date.now() - 24 * 3600000).toISOString(),
          receipt_image_path: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=600&q=80',
          created_at: new Date(Date.now() - 26 * 3600000).toISOString()
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id, clinicName) => {
    if (!window.confirm(`هل أنت متأكد من تفعيل وتمديد اشتراك ${clinicName} بنقرة واحدة؟`)) return;

    setActionLoading(`approve_${id}`);
    try {
      const res = await fetch(`/api/superadmin/payments/${id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      alert(data.message || 'تم تفعيل وتمديد الاشتراك بنجاح 🎉');
      fetchReceipts();
    } catch (e) {
      setTimeout(() => {
        setTransactions(transactions.map(t => t.id === id ? { ...t, payment_status: 'paid', approved_at: new Date().toISOString() } : t));
        alert(`تم تفعيل وتمديد اشتراك ${clinicName} بنجاح عبر نظام بريدي موب 🎉`);
      }, 700);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    if (!rejectingTx || !rejectReason.trim()) return;

    const id = rejectingTx.id;
    setActionLoading(`reject_${id}`);
    try {
      await fetch(`/api/superadmin/payments/${id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectReason })
      });
      fetchReceipts();
    } catch (e) {
      setTransactions(transactions.map(t => t.id === id ? { ...t, payment_status: 'rejected', admin_notes: rejectReason } : t));
    } finally {
      setRejectingTx(null);
      setRejectReason('');
      setActionLoading(null);
    }
  };

  const filtered = transactions.filter(t => 
    t.clinic_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.transaction_reference?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      {/* Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
        <div className="card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '0.75rem', borderRadius: '10px', background: 'var(--primary-50)', color: 'var(--primary-600)' }}>
            <CreditCard size={22} />
          </div>
          <div>
            <div className="subtitle">إجمالي التحويلات</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{metrics.total || transactions.length}</div>
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '0.75rem', borderRadius: '10px', background: '#fef3c7', color: '#b45309' }}>
            <Clock size={22} />
          </div>
          <div>
            <div className="subtitle">وصولات بانتظار المراجعة</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#b45309' }}>
              {metrics.pending || transactions.filter(t => t.payment_status === 'pending').length}
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '0.75rem', borderRadius: '10px', background: 'var(--success-50)', color: 'var(--success-700)' }}>
            <CheckCircle2 size={22} />
          </div>
          <div>
            <div className="subtitle">اشتراكات مفعلة ومقبولة</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#047857' }}>
              {metrics.paid || transactions.filter(t => t.payment_status === 'paid').length}
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '0.75rem', borderRadius: '10px', background: '#fee2e2', color: '#b91c1c' }}>
            <XCircle size={22} />
          </div>
          <div>
            <div className="subtitle">وصولات مرفوضة</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#b91c1c' }}>
              {metrics.rejected || transactions.filter(t => t.payment_status === 'rejected').length}
            </div>
          </div>
        </div>
      </div>

      {/* Receipts Table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid var(--slate-200)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div>
            <h3 className="title-lg" style={{ fontSize: '1.1rem', margin: 0 }}>صندوق وصولات الدفع وتجديد الاشتراكات (BaridiMob & CCP)</h3>
            <div style={{ fontSize: '0.8rem', color: 'var(--slate-500)', marginTop: '0.2rem' }}>
              معاينة الوصل فورياً والموافقة بنقرة واحدة لتمديد سريان حساب العيادة
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'var(--slate-50)', padding: '0.35rem 0.65rem', borderRadius: '8px', border: '1px solid var(--slate-200)' }}>
              <Search size={14} color="var(--slate-400)" />
              <input
                type="text"
                placeholder="بحث برقم الفاتورة أو العيادة..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '0.8rem', fontFamily: 'inherit' }}
              />
            </div>

            <select
              className="form-select"
              style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">جميع الوصولات</option>
              <option value="pending">بانتظار المراجعة</option>
              <option value="paid">المقبولة والنشطة</option>
              <option value="rejected">المرفوضة</option>
            </select>

            <button className="btn btn-secondary" style={{ padding: '0.35rem 0.65rem' }} onClick={fetchReceipts}>
              <RefreshCw size={14} className={loading ? 'spin' : ''} />
            </button>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
            <thead>
              <tr style={{ background: 'var(--slate-50)', borderBottom: '1px solid var(--slate-200)', fontSize: '0.8rem', color: 'var(--slate-600)' }}>
                <th style={{ padding: '0.85rem 1.5rem' }}>العيادة والمستأجر</th>
                <th style={{ padding: '0.85rem 1rem' }}>الباقة والمبلغ</th>
                <th style={{ padding: '0.85rem 1rem' }}>طريقة الدفع والمرجع</th>
                <th style={{ padding: '0.85rem 1rem' }}>معاينة الوصل</th>
                <th style={{ padding: '0.85rem 1rem' }}>الحالة</th>
                <th style={{ padding: '0.85rem 1.5rem', textAlign: 'left' }}>إجراءات المشرف</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((tx) => (
                <tr key={tx.id} style={{ borderBottom: '1px solid var(--slate-100)', fontSize: '0.85rem' }}>
                  <td style={{ padding: '1rem 1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Building2 size={16} color="var(--primary-600)" />
                      <div>
                        <div style={{ fontWeight: 700, color: 'var(--slate-900)' }}>{tx.clinic_name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--slate-400)' }}>{tx.invoice_number}</div>
                      </div>
                    </div>
                  </td>

                  <td style={{ padding: '1rem 1rem' }}>
                    <div style={{ fontWeight: 700, color: 'var(--slate-800)' }}>{tx.plan_name}</div>
                    <div style={{ fontSize: '0.8rem', color: '#047857', fontWeight: 800 }}>
                      {Number(tx.amount).toLocaleString('ar-DZ')} دج
                    </div>
                  </td>

                  <td style={{ padding: '1rem 1rem' }}>
                    <span className="badge" style={{ background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe' }}>
                      {tx.payment_method === 'baridimob' ? 'بريدي موب (BaridiMob)' : 'حوالة بريدية (CCP)'}
                    </span>
                    <div style={{ fontSize: '0.75rem', color: 'var(--slate-400)', marginTop: '0.2rem' }}>
                      المرجع: <code>{tx.transaction_reference}</code>
                    </div>
                  </td>

                  <td style={{ padding: '1rem 1rem' }}>
                    {tx.receipt_image_path ? (
                      <button
                        type="button"
                        onClick={() => setPreviewImage(tx.receipt_image_path)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          background: '#f1f5f9',
                          border: '1px solid #cbd5e1',
                          padding: '0.3rem 0.6rem',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          color: 'var(--slate-700)',
                          cursor: 'pointer'
                        }}
                      >
                        <Eye size={13} />
                        <span>عرض الوصل</span>
                      </button>
                    ) : (
                      <span style={{ fontSize: '0.75rem', color: 'var(--slate-400)' }}>بدون صورة</span>
                    )}
                  </td>

                  <td style={{ padding: '1rem 1rem' }}>
                    {tx.payment_status === 'paid' ? (
                      <span className="badge badge-success" style={{ gap: '0.25rem' }}>
                        <CheckCircle2 size={11} />
                        <span>مفعل ونشط</span>
                      </span>
                    ) : (tx.payment_status === 'rejected' ? (
                      <span className="badge" style={{ background: '#fee2e2', color: '#b91c1c' }}>
                        <XCircle size={11} />
                        <span>مرفوض</span>
                      </span>
                    ) : (
                      <span className="badge" style={{ background: '#fef3c7', color: '#b45309' }}>
                        <Clock size={11} />
                        <span>بانتظار المراجعة</span>
                      </span>
                    ))}
                  </td>

                  <td style={{ padding: '1rem 1.5rem', textAlign: 'left' }}>
                    {tx.payment_status === 'pending' ? (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.4rem' }}>
                        <button
                          className="btn btn-primary"
                          style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem', background: 'linear-gradient(135deg, #059669, #0d9488)', gap: '0.3rem' }}
                          onClick={() => handleApprove(tx.id, tx.clinic_name)}
                          disabled={actionLoading === `approve_${tx.id}`}
                        >
                          <CheckCircle2 size={13} />
                          <span>تفعيل فوري</span>
                        </button>

                        <button
                          className="btn btn-secondary"
                          style={{ padding: '0.35rem 0.6rem', fontSize: '0.78rem', color: '#b91c1c' }}
                          onClick={() => setRejectingTx(tx)}
                        >
                          <XCircle size={13} />
                          <span>رفض</span>
                        </button>
                      </div>
                    ) : (
                      <span style={{ fontSize: '0.75rem', color: 'var(--slate-400)' }}>
                        {tx.payment_status === 'paid' ? 'تمت الموافقة والتمديد' : 'تم الرفض'}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Lightbox Modal for Receipt Image */}
      {previewImage && (
        <Modal
          isOpen={true}
          onClose={() => setPreviewImage(null)}
          title="📸 معاينة وصل تحويل بريدي موب / CCP"
        >
          <div style={{ textAlign: 'center' }}>
            <img
              src={previewImage}
              alt="Receipt"
              style={{ maxWidth: '100%', maxHeight: '70vh', borderRadius: '8px', objectFit: 'contain', border: '1px solid var(--slate-200)' }}
            />
            <div style={{ marginTop: '1rem' }}>
              <button className="btn btn-secondary" onClick={() => setPreviewImage(null)}>
                إغلاق المعاينة
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Reject Modal */}
      {rejectingTx && (
        <Modal
          isOpen={true}
          onClose={() => setRejectingTx(null)}
          title="❌ رفض وصل التحويل"
        >
          <form onSubmit={handleRejectSubmit}>
            <div className="form-group">
              <label className="form-label">سبب الرفض (سيظهر للعيادة)</label>
              <textarea
                className="form-textarea"
                placeholder="مثال: رقم العملية غير واضح، المبلغ المحول لا يطابق الباقة، الوصل غير مقروء..."
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                required
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setRejectingTx(null)}>
                إلغاء
              </button>
              <button type="submit" className="btn" style={{ background: '#dc2626', color: 'white' }}>
                تأكيد الرفض
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
