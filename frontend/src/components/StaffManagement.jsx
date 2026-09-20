import React from 'react';
import { useAuth } from '../context/AuthContext';
import StaffManagementView from './settings/StaffManagementView';

export default function StaffManagement() {
  const { user, tenant } = useAuth();

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <StaffManagementView user={user} tenant={tenant} />
    </div>
  );
}
