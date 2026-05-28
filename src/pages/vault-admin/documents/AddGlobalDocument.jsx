import React from 'react';
import { useNavigate } from 'react-router-dom';
import DocumentLibraryForm from './DocumentLibraryForm';

const AddGlobalDocument = () => {
  const navigate = useNavigate();
  const backPath = '/dashboard/vault-admin/documents/global';

  return (
    <DocumentLibraryForm
      mode="create"
      scopeMode="global"
      onBack={() => navigate(backPath)}
      onSuccess={() => navigate(backPath)}
    />
  );
};

export default AddGlobalDocument;
