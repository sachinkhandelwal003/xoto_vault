import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiService } from '@/api/apiService';
import { Spin } from 'antd';
import DocumentLibraryForm from './DocumentLibraryForm';

const DocumentLibraryManagement = () => {
  const { docId } = useParams();
  const navigate  = useNavigate();

  const [editData, setEditData] = useState(null);
  const [loading,  setLoading]  = useState(false);

  useEffect(() => {
    if (!docId) return;
    setLoading(true);
    apiService.get(`bank/documents/${docId}`)
      .then((res) => { if (res?.success) setEditData(res.data); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [docId]);

  const handleBack    = () => navigate('/dashboard/vault-admin/documents');
  const handleSuccess = () => navigate('/dashboard/vault-admin/documents');

  if (docId && loading) {
    return (
      <div style={{ minHeight:'60vh', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <Spin size="large" tip="Loading document…" />
      </div>
    );
  }

  return (
    <DocumentLibraryForm
      mode={docId ? 'edit' : 'create'}
      editData={docId ? editData : null}
      onBack={handleBack}
      onSuccess={handleSuccess}
    />
  );
};

export default DocumentLibraryManagement;
