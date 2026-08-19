import { create } from 'zustand';

export const useAuthStore = create((set) => ({
  user: {
    id: 'user_specialist_01',
    name: 'د. نادية مرابط',
    email: 'specialist@elamal.local',
    role: 'orthophoniste', // 'superadmin' | 'clinic_admin' | 'orthophoniste' | 'psychologue'
    specialty: 'Orthophonie',
  },
  token: 'mock_token_psypro_2026',
  isAuthenticated: true,

  login: (userData, token) => set({ user: userData, token, isAuthenticated: true }),
  logout: () => set({ user: null, token: null, isAuthenticated: false }),
  switchRole: (newRole) => set((state) => ({
    user: {
      ...state.user,
      role: newRole,
      name: newRole === 'superadmin' ? 'مالك المنصة (SuperAdmin)' : (newRole === 'psychologue' ? 'أ. كريم سعيدي (نفساني)' : 'د. نادية مرابط (أرطوفونية)')
    }
  }))
}));
