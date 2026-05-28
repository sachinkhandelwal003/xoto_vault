import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Card, Row, Col, Avatar, Tag, Spin, Button, Descriptions, Divider } from 'antd';
import { UserOutlined, MailOutlined, PhoneOutlined, SafetyOutlined, EditOutlined } from '@ant-design/icons';
import { apiService } from '@/api/apiService';
import { VAULT_ROLE_SLUG_MAP } from '@/types/auth';

const ROLE_LABELS = {
  '18': 'Vault Admin',
  '21': 'Vault Partner',
  '22': 'Vault Agent',
  '23': 'Mortgage Ops',
  '26': 'Vault Advisor',
};

const VaultAdminProfileView = () => {
  const { user, token } = useSelector((s) => s.auth);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const roleCode = user?.role
    ? typeof user.role === 'object'
      ? String(user.role.code)
      : String(user.role)
    : '18';

  const roleLabel = ROLE_LABELS[roleCode] || 'Vault User';
  const slug = VAULT_ROLE_SLUG_MAP[roleCode] || 'vault-admin';

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    apiService.get('/profile/get-profile-data')
      .then((res) => setProfile(res?.data || res))
      .catch(() => setError('Failed to load profile'))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <Spin size="large" />
    </div>
  );

  const name = profile?.name
    ? `${profile.name.first_name || ''} ${profile.name.last_name || ''}`.trim()
    : profile?.first_name
    ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim()
    : user?.name || 'Vault User';

  const email = profile?.email || user?.email || '';
  const phone = profile?.phone?.number
    ? `${profile.phone.country_code || ''} ${profile.phone.number}`
    : profile?.phone_number || '';

  return (
    <div>
      <div
        className="rounded-2xl p-6 mb-6 text-white"
        style={{ background: 'linear-gradient(135deg, #5C039B, #03A4F4)' }}
      >
        <div className="flex items-center gap-6">
          <Avatar
            size={80}
            icon={<UserOutlined />}
            src={profile?.profileImage || profile?.avatar}
            style={{ backgroundColor: 'rgba(255,255,255,0.3)', border: '3px solid rgba(255,255,255,0.5)' }}
          />
          <div>
            <h1 className="text-2xl font-bold mb-1">{name}</h1>
            <div className="flex items-center gap-3">
              <Tag color="rgba(255,255,255,0.2)" style={{ color: '#fff', border: '1px solid rgba(255,255,255,0.3)' }}>
                <SafetyOutlined className="mr-1" />
                {roleLabel}
              </Tag>
              {email && (
                <span className="text-purple-100 text-sm">
                  <MailOutlined className="mr-1" />
                  {email}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card
            className="rounded-2xl border-0 shadow-sm"
            title={
              <div className="flex items-center justify-between">
                <span className="font-semibold">Profile Information</span>
                <Button size="small" icon={<EditOutlined />} style={{ borderColor: '#5C039B', color: '#5C039B' }}>
                  Edit
                </Button>
              </div>
            }
          >
            {error ? (
              <div className="text-center py-8">
                <p className="text-red-500 mb-3">{error}</p>
                <Button onClick={() => window.location.reload()}>Retry</Button>
              </div>
            ) : (
              <Descriptions column={{ xs: 1, sm: 2 }} bordered size="middle">
                <Descriptions.Item label="Full Name">{name || '—'}</Descriptions.Item>
                <Descriptions.Item label="Email">{email || '—'}</Descriptions.Item>
                <Descriptions.Item label="Phone">{phone || '—'}</Descriptions.Item>
                <Descriptions.Item label="Role">{roleLabel}</Descriptions.Item>
                {profile?.nationality && <Descriptions.Item label="Nationality">{profile.nationality}</Descriptions.Item>}
                {profile?.gender && <Descriptions.Item label="Gender">{profile.gender}</Descriptions.Item>}
                {profile?.dateOfBirth && (
                  <Descriptions.Item label="Date of Birth">
                    {new Date(profile.dateOfBirth).toLocaleDateString('en-AE')}
                  </Descriptions.Item>
                )}
                {profile?.address && (
                  <Descriptions.Item label="Location" span={2}>
                    {[profile.address.city, profile.address.state, profile.address.country].filter(Boolean).join(', ')}
                  </Descriptions.Item>
                )}
                {profile?.emiratesIdNumber && <Descriptions.Item label="Emirates ID">{profile.emiratesIdNumber}</Descriptions.Item>}
              </Descriptions>
            )}
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card className="rounded-2xl border-0 shadow-sm" title={<span className="font-semibold">Account Details</span>}>
            <div className="space-y-4">
              {[
                { icon: <SafetyOutlined />, label: 'Role', value: roleLabel, color: '#5C039B' },
                { icon: <MailOutlined />, label: 'Email', value: email, color: '#03A4F4' },
                { icon: <PhoneOutlined />, label: 'Phone', value: phone, color: '#10B981' },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white text-sm flex-shrink-0" style={{ background: item.color }}>
                    {item.icon}
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">{item.label}</p>
                    <p className="text-sm font-medium text-gray-700">{item.value || '—'}</p>
                  </div>
                </div>
              ))}

              <Divider className="my-2" />

              {profile?.bankName && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Bank Details</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-gray-500">Bank</span><span className="font-medium">{profile.bankName}</span></div>
                    {profile.iban && <div className="flex justify-between"><span className="text-gray-500">IBAN</span><span className="font-medium text-xs">{profile.iban}</span></div>}
                    {profile.accountType && <div className="flex justify-between"><span className="text-gray-500">Type</span><span className="font-medium">{profile.accountType}</span></div>}
                  </div>
                </div>
              )}
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default VaultAdminProfileView;
