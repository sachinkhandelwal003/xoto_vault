import React from 'react';
import { useSelector } from 'react-redux';
import VaultAgentProfile from './VaultAgentProfile';
import VaultPartnerProfile from './VaultPartnerProfile';
import VaultAdminProfileView from './VaultAdminProfileView';

const VaultProfile = () => {
  const { user } = useSelector((s) => s.auth);
  const roleCode = user?.role
    ? typeof user.role === 'object'
      ? Number(user.role.code)
      : Number(user.role)
    : 18;

  switch (roleCode) {
    case 22:
      return <VaultAgentProfile />;
    case 21:
      return <VaultPartnerProfile />;
    default:
      return <VaultAdminProfileView />;
  }
};

export default VaultProfile;
