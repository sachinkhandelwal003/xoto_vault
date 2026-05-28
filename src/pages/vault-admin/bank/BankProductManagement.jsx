import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Spin } from 'antd';
import { apiService } from '@/api/apiService';
import BankProductForm from './Bankproductform';

const BankProductManagement = ({ viewMode = false }) => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const bankId = new URLSearchParams(location.search).get('bank');

  const [editData, setEditData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!productId) return;
    setLoading(true);
    apiService
      .get(`bank/products/${productId}`)
      .then((res) => {
        if (res?.success) setEditData(res.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [productId]);

  const backUrl = bankId
    ? `/dashboard/vault-admin/bank/products?bank=${bankId}`
    : '/dashboard/vault-admin/bank/products';

  const handleBack = () => navigate(backUrl);
  const handleSuccess = () => navigate(backUrl);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <Spin size="large" tip="Loading product data..." />
      </div>
    );
  }

  return (
    <BankProductForm
      mode={viewMode ? 'view' : (productId ? 'edit' : 'create')}
      editData={productId ? editData : null}
      initialBankId={!productId ? bankId : null}
      onBack={handleBack}
      onSuccess={handleSuccess}
    />
  );
};

export default BankProductManagement;
