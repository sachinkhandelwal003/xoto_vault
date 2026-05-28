import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import BankProductList from './Bankproductlist';

const BankProducts = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const bankId = new URLSearchParams(location.search).get('bank');

  const handleCreate = (bid) => {
    const id = bid || bankId;
    const url = id
      ? `/dashboard/vault-admin/bank/products/manage?bank=${id}`
      : '/dashboard/vault-admin/bank/products/manage';
    navigate(url);
  };

  const handleEdit = (productId) => {
    const url = bankId
      ? `/dashboard/vault-admin/bank/products/manage/${productId}?bank=${bankId}`
      : `/dashboard/vault-admin/bank/products/manage/${productId}`;
    navigate(url);
  };

  const handleView = (productId) => {
    const url = bankId
      ? `/dashboard/vault-admin/bank/products/view/${productId}?bank=${bankId}`
      : `/dashboard/vault-admin/bank/products/view/${productId}`;
    navigate(url);
  };

  return (
    <BankProductList
      onCreate={handleCreate}
      onEdit={handleEdit}
      onView={handleView}
    />
  );
};

export default BankProducts;
