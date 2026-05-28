import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { apiService } from '@/api/apiService';
import { Spin } from 'antd';
import BankForm from './BankForm';

const BankManagement = () => {
  const { bankId } = useParams();
  const navigate = useNavigate();
  const [editData, setEditData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!bankId) return;

    setLoading(true);
    apiService
      .get(`bank/${bankId}`)
      .then((res) => {
        const data = res?.success ? res.data : res;
        setEditData(data);
      })
      .catch((err) => {
        console.error('Fetch bank error', err);
      })
      .finally(() => setLoading(false));
  }, [bankId]);

  const handleBack = () => {
    navigate('/dashboard/vault-admin/bank/list');
  };

  const handleSuccess = () => {
    navigate('/dashboard/vault-admin/bank/list');
  };

  if (bankId && loading) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Spin tip="Loading bank data..." size="large" />
      </div>
    );
  }

  return (
    <BankForm
      mode={bankId ? 'edit' : 'create'}
      editData={bankId ? editData : null}
      onBack={handleBack}
      onSuccess={handleSuccess}
    />
  );
};

export default BankManagement;
