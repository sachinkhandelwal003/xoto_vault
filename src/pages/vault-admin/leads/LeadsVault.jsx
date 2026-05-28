import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { Spin } from "antd";
import { apiService } from "@/api/apiService";
import AdvisorLeads from "./AdvisorLeads";
import VaultLeads from "./VaultLeads";
import VaultAgentLeadList from "./VaultAgentLeadList";

const LeadsVault = () => {
  const { user } = useSelector((state) => state.auth);

  const [agentType, setAgentType] = useState(user?.agentType ?? null);
  const [resolving, setResolving] = useState(false);

  const roleCode = user?.role
    ? typeof user.role === "object" ? String(user.role.code) : String(user.role)
    : null;

  useEffect(() => {
    if (roleCode !== "22" || agentType !== null) return;

    setResolving(true);
    apiService
      .get("/profile/get-profile-data")
      .then((res) => setAgentType(res?.data?.agentType ?? "ReferralPartner"))
      .catch(() => setAgentType("ReferralPartner"))
      .finally(() => setResolving(false));
  }, [roleCode, agentType]);

  if (!user || !roleCode) return <div>No user found</div>;

  if (roleCode === "22" && resolving) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <Spin size="large" />
      </div>
    );
  }

  // Advisor — tabs, eligibility, status update
  if (roleCode === "26") return <AdvisorLeads />;

  // PartnerAffiliatedAgent — partner-style lead list (own leads via /vault/lead/my-leads)
  if (roleCode === "22" && agentType === "PartnerAffiliatedAgent")
    return <VaultAgentLeadList />;

  // ReferralPartner — basic list (submit leads only)
  if (roleCode === "22") return <VaultLeads />;

  return <VaultAgentLeadList />;
};

export default LeadsVault;
