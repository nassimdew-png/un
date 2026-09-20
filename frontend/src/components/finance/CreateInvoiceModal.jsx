import React, { useState, useEffect } from 'react';
import { invoiceApi } from '../../api';
import { DollarSign, Plus, Trash2, X, Check, CreditCard, Sparkles, User, Calendar, FileText, Building2, ShieldCheck } from 'lucide-react';

const CLINICAL_PRESETS = [
  { label: 'استشارة عيادية متخصصة', fr: 'Consultation Clinique', price: 2500 },
  { label: 'حصة تقويم وتأهيل النطق', fr: 'Séance Orthophonie', price: 2000 },
  { label: 'فحص وحصيلة أرطوفونية رسمية', fr: 'Bilan Orthophonique Complet', price: 4500 },
  { label: 'حصة علاج معرفي سلوكي CBT', fr: 'Séance Thérapie TCC / Psychologie', price: 2500 },
  { label: 'تمرير مقاييس واختبارات نفسية', fr: 'Passation Tests Psychométriques', price: 3500 },
  { label: 'حصة تأهيل نفسي حركي', fr: 'Séance Psychomotricité', price: 2000 },
  { label: 'حصيلة نفسية حركية معتمدة', fr: 'Bilan Psychomoteur', price: 4000 },
];

const B2B_PRESETS = [
  { label: 'اشتراك منصة PsyPro - باقة النمو (Plan Pro Trimestriel)', fr: 'Souscription Trimestrielle Pro', price: 15000, plan: 'multi_pro', period: 'trimestriel' },
  { label: 'اشتراك سنوي شامل - باقة العيادة الكاملة (Plan Annuel Entreprise)', fr: 'Abonnement Annuel Entreprise', price: 48000, plan: 'enterprise_dz', period: 'annuel' },
  { label: 'اشتراك شهري مرن - عيادة فردية (Plan Solo Mensuel)', fr: 'Abonnement Mensuel Solo', price: 5500, plan: 'solo_starter', period: 'mensuel' },
  { label: 'تفعيل أستوديو الذكاء الاصطناعي وبوابة الأولياء (Module AI & Portails)', fr: 'Module Add-on AI Studio', price: 8000, plan: 'multi_pro', period: 'annuel' },
];

export default function CreateInvoiceModal({
  isOpen,
  onClose,
  onSuccess,
  patients = [],
  tenant,
  preselectedAppointment,
}) {
  // Invoice Type: 'clinical_receipt' | 'b2b_subscription'
  const [invoiceType, setInvoiceType] = useState('clinical_receipt');

  // Clinical fields
  const [patientId, setPatientId] = useState('');
  const [issuedDate, setIssuedDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');

  // B2B Enterprise / Clinic fields
  const [companyName, setCompanyName] = useState(tenant?.name || '');
  const [taxId, setTaxId] = useState(''); // NIF
  const [tradeRegister, setTradeRegister] = useState(''); // RC
  const [nisNumber, setNisNumber] = useState(''); // NIS
  const [subscriptionPlan, setSubscriptionPlan] = useState('multi_pro');
  const [billingPeriod, setBillingPeriod] = useState('annuel');
  const [subscriptionRef, setSubscriptionRef] = useState(`SUB-${new Date().getFullYear()}-001`);
  const [periodStart, setPeriodStart] = useState(new Date().toISOString().split('T')[0]);
  const [periodEnd, setPeriodEnd] = useState(new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  const [taxRate, setTaxRate] = useState(19); // 0 or 9 or 19%

  const [items, setItems] = useState([
    {
      description: 'استشارة سريرية متخصصة',
      quantity: 1,
      unit_price: 2500,
    },
  ]);

  const itemsSubtotal = items.reduce(
    (acc, item) => acc + (Number(item.quantity) || 1) * (Number(item.unit_price) || 0),
    0
  );

  // Calculations: for B2B with taxRate
  const isB2b = invoiceType === 'b2b_subscription';
  const subtotalHt = isB2b ? itemsSubtotal : itemsSubtotal;
  const calculatedTaxAmount = isB2b && Number(taxRate) > 0 ? Math.round(subtotalHt * (Number(taxRate) / 100)) : 0;
  const totalAmount = isB2b ? subtotalHt + calculatedTaxAmount : itemsSubtotal;

  const [paidAmount, setPaidAmount] = useState(totalAmount);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (preselectedAppointment) {
      if (preselectedAppointment.patient_id) {
        setPatientId(preselectedAppointment.patient_id);
      }
      const typeLabel = preselectedAppointment.type || preselectedAppointment.specialty || 'جلسة استشارة سريرية';
      setItems([
        {
          description: `جلسة استشارة ومتابعة سريرية (${typeLabel})`,
          quantity: 1,
          unit_price: 2500,
        },
      ]);
      setPaidAmount(2500);
    } else if (patients.length > 0 && !patientId) {
      setPatientId(patients[0].id);
    }
  }, [preselectedAppointment, patients]);

  // Keep paidAmount in sync when total changes unless manually edited
  useEffect(() => {
    setPaidAmount(totalAmount);
  }, [totalAmount]);

  const handleSwitchInvoiceType = (type) => {
    setInvoiceType(type);
    setError('');
    if (type === 'b2b_subscription') {
      setPaymentMethod('bank_transfer');
      setItems([
        {
          description: 'اشتراك منصة PsyPro السحابية - باقة المراكز والعيادات (Plan Multi-Pro)',
          quantity: 1,
          unit_price: 15000,
        },
      ]);
      if (!companyName && tenant?.name) {
        setCompanyName(tenant.name);
      }
    } else {
      setPaymentMethod('cash');
      setItems([
        {
          description: 'استشارة سريرية متخصصة',
          quantity: 1,
          unit_price: 2500,
        },
      ]);
    }
  };

  const handlePresetClick = (preset) => {
    setItems((prev) => [
      ...prev,
      {
        description: `${preset.label} (${preset.fr})`,
        quantity: 1,
        unit_price: preset.price,
      },
    ]);
  };

  const handleB2bPresetClick = (preset) => {
    setSubscriptionPlan(preset.plan);
    setBillingPeriod(preset.period);
    setItems([
      {
        description: `${preset.label} (${preset.fr})`,
        quantity: 1,
        unit_price: preset.price,
      },
    ]);
  };

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      { 
        description: isB2b ? 'بند ترخيص أو وحدة إضافية' : 'بند خدمة سريرية إضافية', 
        quantity: 1, 
        unit_price: isB2b ? 5000 : 2000 
      },
    ]);
  };

  const handleRemoveItem = (index) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index, field, value) => {
    const updated = [...items];
    updated[index][field] = value;
    setItems(updated);
  };

  const handleSetFullPayment = () => {
    setPaidAmount(totalAmount);
  };

  const handleSetZeroPayment = () => {
    setPaidAmount(0);
  };

  const handleSetHalfPayment = () => {
    setPaidAmount(Math.round(totalAmount / 2));
  };

  const remaining = Math.max(0, totalAmount - (Number(paidAmount) || 0));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isB2b && !patientId) {
      setError('يرجى اختيار المريض لسند القبض السريري');
      return;
    }
    if (isB2b && !companyName.trim()) {
      setError('يرجى إدخال اسم المؤسسة أو الشركة أو العيادة المستفيدة');
      return;
    }
    if (items.length === 0) {
      setError('يجب إضافة بند واحد على الأقل في الفاتورة');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const payload = {
        invoice_type: invoiceType,
        total_amount: totalAmount,
        paid_amount: Number(paidAmount) || 0,
        payment_method: paymentMethod,
        issued_date: issuedDate,
        due_date: dueDate || null,
        items,
      };

      if (isB2b) {
        payload.company_name = companyName.trim();
        payload.tax_id = taxId.trim() || null;
        payload.trade_register = tradeRegister.trim() || null;
        payload.nis_number = nisNumber.trim() || null;
        payload.subscription_ref = subscriptionRef.trim() || null;
        payload.subscription_plan = subscriptionPlan;
        payload.billing_period = billingPeriod;
        payload.period_start = periodStart || null;
        payload.period_end = periodEnd || null;
        payload.subtotal_ht = subtotalHt;
        payload.tax_rate = Number(taxRate) || 0;
        payload.tax_amount = calculatedTaxAmount;
        payload.patient_id = patientId || null;
        payload.appointment_id = null;
      } else {
        payload.patient_id = patientId;
        payload.appointment_id = preselectedAppointment?.id || null;
      }

      await invoiceApi.create(payload);

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error('Error creating invoice:', err);
      setError(err.response?.data?.message || err.message || 'خطأ أثناء إنشاء الفاتورة');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-150" dir="rtl">
      <div className="glass-modal rounded-3xl w-full max-w-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 sm:p-7 space-y-5 my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3 space-x-reverse">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white">
                {isB2b ? 'إصدار فاتورة تجارية وضريبية B2B لاشتراك العيادة' : 'إصدار سند قبض / فاتورة سريرية جديدة'}
              </h3>
              <p className="text-xs text-slate-400">
                {tenant?.name || 'العيادة التخصصية'} • العملة الرسمية: الدينار الجزائري (DZD)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Invoice Type Switcher Tab */}
        <div className="grid grid-cols-2 gap-2 p-1.5 rounded-2xl bg-slate-950 border border-slate-800">
          <button
            type="button"
            onClick={() => handleSwitchInvoiceType('clinical_receipt')}
            className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              invoiceType === 'clinical_receipt'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>🩺 سند أتعاب سريري (Patient Receipt)</span>
          </button>

          <button
            type="button"
            onClick={() => handleSwitchInvoiceType('b2b_subscription')}
            className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              invoiceType === 'b2b_subscription'
                ? 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white shadow-md shadow-teal-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>🏢 فاتورة تجارية وضريبية B2B (اشتراك عيادة)</span>
          </button>
        </div>

        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Clinical Patient Mode */}
          {!isB2b && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-1">
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  المريض المستفيد *
                </label>
                <select
                  required
                  value={patientId}
                  onChange={(e) => setPatientId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="">-- اختر المريض --</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.first_name} {p.last_name} {p.phone ? `(${p.phone})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  تاريخ الإصدار (Date) *
                </label>
                <input
                  type="date"
                  required
                  value={issuedDate}
                  onChange={(e) => setIssuedDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  تاريخ الاستحقاق (Échéance)
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          )}

          {/* B2B Commercial Enterprise Mode */}
          {isB2b && (
            <div className="p-4 rounded-2xl bg-slate-950/70 border border-teal-500/30 space-y-3.5">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-xs font-bold text-teal-300 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-teal-400" />
                  <span>بيانات المؤسسة والتعريف الجبائي (Identifiants Fiscaux B2B)</span>
                </span>
                <span className="text-[10px] text-slate-400 font-mono">فاتورة تجارية نظامية</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    اسم المؤسسة / الشركة أو العيادة المستفيدة *
                  </label>
                  <input
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="مثال: عيادة الأمل للطب النفسي SARL"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    الرقم التعريفي الجبائي (NIF / VAT ID) *
                  </label>
                  <input
                    type="text"
                    value={taxId}
                    onChange={(e) => setTaxId(e.target.value)}
                    placeholder="002116000000000"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-teal-300 font-mono focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    السجل التجاري (Registre de Commerce / RC)
                  </label>
                  <input
                    type="text"
                    value={tradeRegister}
                    onChange={(e) => setTradeRegister(e.target.value)}
                    placeholder="16/00-1234567B21"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    رقم التعريف الإحصائي (NIS)
                  </label>
                  <input
                    type="text"
                    value={nisNumber}
                    onChange={(e) => setNisNumber(e.target.value)}
                    placeholder="00123456789"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              {/* Subscription Plan & Billing Period */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-800/80">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    باقة الاشتراك
                  </label>
                  <select
                    value={subscriptionPlan}
                    onChange={(e) => setSubscriptionPlan(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
                  >
                    <option value="solo_starter">باقة فردية (Solo Starter)</option>
                    <option value="multi_pro">باقة نمو (Multi-Pro)</option>
                    <option value="enterprise_dz">باقة المؤسسات (Enterprise)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    دورة الفوترة
                  </label>
                  <select
                    value={billingPeriod}
                    onChange={(e) => setBillingPeriod(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
                  >
                    <option value="mensuel">شهري (Mensuel)</option>
                    <option value="trimestriel">ربع سنوي (Trimestriel)</option>
                    <option value="semestriel">سداسي (Semestriel)</option>
                    <option value="annuel">سنوي (Annuel)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    بداية الفترة (Du)
                  </label>
                  <input
                    type="date"
                    value={periodStart}
                    onChange={(e) => setPeriodStart(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    نهاية الفترة (Au)
                  </label>
                  <input
                    type="date"
                    value={periodEnd}
                    onChange={(e) => setPeriodEnd(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              {/* Tax Rate Selection (TVA) */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                <span className="text-xs font-bold text-slate-300">نسبة الرسم على القيمة المضافة (Taux TVA) :</span>
                <div className="flex items-center gap-2">
                  {[
                    { val: 0, label: '0% (إعفاء ضريبي)' },
                    { val: 9, label: '9% (مخفض)' },
                    { val: 19, label: '19% (النسبة العادية)' },
                  ].map((rate) => (
                    <button
                      type="button"
                      key={rate.val}
                      onClick={() => setTaxRate(rate.val)}
                      className={`px-3 py-1 rounded-xl text-xs font-mono font-bold transition ${
                        Number(taxRate) === rate.val
                          ? 'bg-teal-600 text-white shadow-sm'
                          : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'
                      }`}
                    >
                      {rate.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Quick Presets */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-300 flex items-center space-x-1.5 space-x-reverse">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>{isB2b ? 'باقات الاشتراكات السحابية الجاهزة (B2B SaaS Plans):' : 'إدراج سريع للخدمات والتدخلات السريرية الشائعة:'}</span>
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {!isB2b && CLINICAL_PRESETS.map((preset, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => handlePresetClick(preset)}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 text-slate-300 hover:text-emerald-300 text-[11px] font-medium transition-all flex items-center space-x-1.5 space-x-reverse"
                >
                  <Plus className="w-3 h-3 text-emerald-400" />
                  <span>{preset.label}</span>
                  <span className="text-[10px] text-emerald-400/80 font-mono">({preset.price} دج)</span>
                </button>
              ))}

              {isB2b && B2B_PRESETS.map((preset, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => handleB2bPresetClick(preset)}
                  className="px-3 py-1.5 rounded-xl bg-teal-950/40 hover:bg-teal-900/40 border border-teal-500/30 text-teal-300 text-[11px] font-bold transition-all flex items-center space-x-1.5 space-x-reverse"
                >
                  <Plus className="w-3 h-3 text-teal-400" />
                  <span>{preset.label}</span>
                  <span className="text-[10px] text-teal-300/80 font-mono">({preset.price.toLocaleString()} دج)</span>
                </button>
              ))}
            </div>
          </div>

          {/* Line Items Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300">
                {isB2b ? 'بنود الاشتراك والخدمات السحابية (Lignes de Souscription)' : 'بنود ومحتويات الفاتورة (Actes & Prestations)'}
              </label>
              <button
                type="button"
                onClick={handleAddItem}
                className="text-[11px] font-bold text-teal-400 hover:text-teal-300 flex items-center space-x-1 space-x-reverse"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>إضافة بند مخصص</span>
              </button>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {items.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 p-2.5 rounded-2xl bg-slate-950/70 border border-slate-800/80"
                >
                  <div className="flex-1">
                    <input
                      type="text"
                      required
                      placeholder="وصف الخدمة أو الباقة المفوترة..."
                      value={item.description}
                      onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                      className="w-full bg-transparent border-none text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-0"
                    />
                  </div>

                  <div className="w-16">
                    <input
                      type="number"
                      required
                      min="1"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, 'quantity', Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2 py-1 text-xs text-center text-white font-mono"
                      placeholder="الكمية"
                    />
                  </div>

                  <div className="w-28 relative">
                    <input
                      type="number"
                      required
                      step="100"
                      value={item.unit_price}
                      onChange={(e) => handleItemChange(index, 'unit_price', Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1 text-xs text-left text-teal-300 font-mono font-bold"
                      placeholder={isB2b ? 'السعر HT' : 'السعر'}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveItem(index)}
                    disabled={items.length <= 1}
                    className="p-1.5 rounded-xl bg-slate-900 hover:bg-red-500/20 text-slate-500 hover:text-red-400 disabled:opacity-30"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Payment Details & Quick Buttons */}
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Payment Method */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-2">
                  طريقة التسديد (Mode de Règlement)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'cash', label: '💵 نقداً', sub: 'Espèces' },
                    { id: 'baridimob', label: '📱 بريدي موب', sub: 'BaridiMob' },
                    { id: 'bank_transfer', label: '🏦 تحويل بنكي', sub: 'Virement' },
                    { id: 'check', label: '📜 صك', sub: 'Chèque' },
                  ].map((m) => (
                    <button
                      type="button"
                      key={m.id}
                      onClick={() => setPaymentMethod(m.id)}
                      className={`p-2 rounded-xl border text-center transition-all ${
                        paymentMethod === m.id
                          ? 'bg-emerald-600/25 border-emerald-500 text-emerald-300 shadow-sm'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="text-xs font-bold">{m.label}</div>
                      <div className="text-[10px] text-slate-500">{m.sub}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Paid Amount */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-300">
                    المبلغ المقبوض حالياً (Montant Réglé)
                  </label>
                  <div className="flex items-center gap-1.5 text-[10px]">
                    <button
                      type="button"
                      onClick={handleSetFullPayment}
                      className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30"
                    >
                      كامل
                    </button>
                    <button
                      type="button"
                      onClick={handleSetHalfPayment}
                      className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 hover:bg-amber-500/30"
                    >
                      النصف
                    </button>
                    <button
                      type="button"
                      onClick={handleSetZeroPayment}
                      className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 hover:bg-rose-500/30"
                    >
                      آجل (0)
                    </button>
                  </div>
                </div>

                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="100"
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-3.5 py-2 text-emerald-300 font-mono font-black text-base focus:outline-none focus:border-emerald-500"
                  />
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">
                    دج
                  </span>
                </div>

                {/* Calculation breakdown */}
                <div className="mt-2.5 space-y-1 text-xs pt-2 border-t border-slate-800/80">
                  {isB2b && (
                    <>
                      <div className="flex justify-between text-slate-400">
                        <span>المبلغ الصافي (Montant HT) :</span>
                        <span className="font-mono font-bold text-slate-300">{subtotalHt.toLocaleString()} دج</span>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>الضريبة (TVA {taxRate}%) :</span>
                        <span className="font-mono font-bold text-teal-400">{calculatedTaxAmount.toLocaleString()} دج</span>
                      </div>
                    </>
                  )}
                  <div className="flex justify-between text-slate-300 font-bold">
                    <span>المجموع الإجمالي (Total {isB2b ? 'TTC' : ''}) :</span>
                    <span className="font-mono font-black text-white">{totalAmount.toLocaleString()} دج</span>
                  </div>
                  <div className={`flex justify-between font-bold pt-1 ${remaining > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                    <span>حالة التسديد :</span>
                    <span>{remaining > 0 ? `المتبقي المطلوب: ${remaining.toLocaleString()} دج` : '✓ مسدد بالكامل'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Modal Footer Actions */}
          <div className="flex items-center justify-end space-x-3 space-x-reverse pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors"
            >
              إلغاء
            </button>

            <button
              type="submit"
              disabled={loading || totalAmount <= 0}
              className="px-7 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs shadow-lg shadow-emerald-600/25 transition-all disabled:opacity-50 flex items-center space-x-2 space-x-reverse"
            >
              {loading ? (
                <span>جارٍ إصدار الفاتورة...</span>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>{isB2b ? 'إصدار وتثبيت الفاتورة التجارية B2B' : 'إصدار الفاتورة وتثبيت السند'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
