import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { Spin } from "antd";
import { apiService } from "@/api/apiService";
import VaultAgentLeadDetail from "./VaultAgentLeadDetail";
import VaultAgentLeadViewAdvisor from "./VaultAgentLeadViewAdvisor";
import PartnerLeadDetail from "../../vault-partner/PartnerLeadDetail";

const AgentsLeadFullView = () => {
  const { user } = useSelector((state) => state.auth);

  // agentType may or may not be in the JWT — initialize from Redux, fetch from API if missing
  const [agentType, setAgentType] = useState(user?.agentType ?? null);
  const [resolving, setResolving] = useState(false);

  const roleCode = user?.role
    ? typeof user.role === "object" ? String(user.role.code) : String(user.role)
    : null;

  useEffect(() => {
    // Only needed for role 22 when agentType wasn't in the JWT
    if (roleCode !== "22" || agentType !== null) return;

    setResolving(true);
    apiService
      .get("/profile/get-profile-data")
      .then((res) => {
        setAgentType(res?.data?.agentType ?? "ReferralPartner");
      })
      .catch(() => {
        setAgentType("ReferralPartner"); // safe fallback
      })
      .finally(() => setResolving(false));
  }, [roleCode, agentType]);

  if (!user || !roleCode) return <div>No user found</div>;

  // Show spinner while resolving agentType for role 22
  if (roleCode === "22" && resolving) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <Spin size="large" />
      </div>
    );
  }

  // Advisor (role 26) — full lead management view
  if (roleCode === "26") return <VaultAgentLeadViewAdvisor />;

  // Partner (role 21) — partner-style full detail
  if (roleCode === "21") return <PartnerLeadDetail />;

  // PartnerAffiliatedAgent (role 22) — same full view as advisor
  // (status updates, eligibility check, proposal/case creation)
  if (roleCode === "22" && agentType === "PartnerAffiliatedAgent")
    return <VaultAgentLeadViewAdvisor />;

  // ReferralPartner (role 22, agentType !== PartnerAffiliatedAgent) — read-only basic detail
  return <VaultAgentLeadDetail />;
};

export default AgentsLeadFullView;
