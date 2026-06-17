import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import BankProductList from '../../pages/vault-admin/bank/Bankproductlist';

export default function PartnerBankProducts() {
  const navigate = useNavigate();
  const location = useLocation();
  
  const basePath = location.pathname.match(/^\/dashboard\/[^\/]+/)?.[0] || '/dashboard/vaultpartner';

  const handleView = (productId) => {
    navigate(`${basePath}/bank/products/${productId}`);
  };

  return (
    <BankProductList
      onView={handleView}
    />
  );
}
