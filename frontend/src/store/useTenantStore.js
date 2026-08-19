import { create } from 'zustand';

export const useTenantStore = create((set) => ({
  tenant: {
    id: 'tenant_elamal_01',
    name: 'عيادة الأمل للأرطوفونيا والدعم النفسي',
    subdomain: 'elamal',
    specialty_type: 'multidisciplinary',
    subscription: {
      status: 'active',
      plan: 'annual_standard',
      expires_at: '2027-08-19'
    },
    settings: {
      phone: '0550 12 34 56',
      address: 'الجزائر العاصمة - حي حيدرة',
      logo: null
    }
  },
  availableTenants: [
    {
      id: 'tenant_elamal_01',
      name: 'عيادة الأمل للأرطوفونيا والدعم النفسي',
      subdomain: 'elamal',
      specialty_type: 'multidisciplinary',
      patientsCount: 48,
    },
    {
      id: 'tenant_nassir_02',
      name: 'مركز النور لعلاج اضطرابات النطق',
      subdomain: 'al-noor',
      specialty_type: 'orthophonie',
      patientsCount: 32,
    },
    {
      id: 'tenant_afaq_03',
      name: 'عيادة آفاق للإرشاد والاستشارات النفسية',
      subdomain: 'afaq-psy',
      specialty_type: 'psychology',
      patientsCount: 29,
    }
  ],

  setTenant: (tenant) => set({ tenant }),
  selectTenantBySubdomain: (subdomain) => set((state) => {
    const found = state.availableTenants.find(t => t.subdomain === subdomain);
    return found ? { tenant: { ...state.tenant, ...found } } : state;
  })
}));
