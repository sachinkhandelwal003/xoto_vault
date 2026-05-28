import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import DocumentLibraryForm from './DocumentLibraryForm';

const AddBankDocument = () => {
  const navigate = useNavigate();
  const { bankId } = useParams();

  const backPath = bankId
    ? `/dashboard/vault-admin/documents/bank/${bankId}`
    : '/dashboard/vault-admin/documents/bank';

  return (
    <DocumentLibraryForm
      mode="create"
      scopeMode="bank"
      defaultBankIds={bankId ? [bankId] : []}
      onBack={() => navigate(backPath)}
      onSuccess={() => navigate(backPath)}
    />
  );
};

export default AddBankDocument;
