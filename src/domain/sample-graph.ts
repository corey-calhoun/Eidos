import type { AssuranceGraph } from "./graph.js";

const observedAt = "2026-09-01T00:00:00.000Z";
const verifiedAt = "2026-09-01T01:00:00.000Z";

function provenance(sourceReference: string) {
  return {
    authority: "human" as const,
    sourceType: "consultant_observation" as const,
    sourceReference,
    observedAt,
    verifiedAt,
    verifiedBy: "consultant@eidos.local",
    confidence: 1,
  };
}

function proposedProvenance(sourceReference: string) {
  return {
    authority: "client_asserted" as const,
    sourceType: "client_document" as const,
    sourceReference,
    observedAt,
    confidence: 0.7,
  };
}

export const sampleGraph: AssuranceGraph = {
  nodes: [
    { id: "objective_protect_customers", type: "business_objective", label: "Protect customer orders and personal data", assurance: "partially_effective", provenance: provenance("engagement://acme/objective/state"), summary: "Maintain customer trust and the confidentiality and integrity of order data." },
    { id: "app_acme_orders", type: "application", label: "Acme Orders", assurance: "partially_effective", provenance: provenance("engagement://acme/application/state"), summary: "Internet-facing ordering application used by customers and administrators." },
    { id: "asset_customer_db", type: "asset", label: "Customer database", assurance: "partially_effective", provenance: provenance("engagement://acme/asset/state"), severity: "critical", summary: "Stores customer profiles, addresses, and order history." },
    { id: "identity_admin", type: "identity", label: "Application administrator", assurance: "implemented_unverified", provenance: provenance("engagement://acme/identity/state"), summary: "Privileged operator identity for application administration." },
    { id: "threat_credential_attack", type: "threat", label: "Credential attack", assurance: "unknown", severity: "high", summary: "An Internet attacker attempts to obtain administrative access." },
    { id: "finding_password_only", type: "finding", label: "Password-only administration", assurance: "failed", provenance: provenance("engagement://acme/finding/state"), severity: "critical", summary: "The administrative console accepted password-only authentication during the initial assessment." },
    { id: "risk_admin_compromise", type: "risk", label: "Administrative account compromise", assurance: "failed", provenance: provenance("engagement://acme/risk/state"), severity: "critical", summary: "A compromised administrator can export customer and order data." },
    { id: "control_admin_mfa", type: "control", label: "Administrator MFA", assurance: "validated", provenance: provenance("engagement://acme/control/state"), summary: "Administrative authentication requires a second factor through the identity provider." },
    { id: "validation_mfa_login", type: "validation_activity", label: "Attempt login without MFA", assurance: "validated", provenance: provenance("engagement://acme/validation/state"), summary: "The consultant attempted administrative authentication without completing the second factor." },
    { id: "evidence_mfa_test", type: "evidence", label: "MFA enforcement test result", assurance: "validated", provenance: provenance("engagement://acme/evidence/state"), summary: "Dated test record showing that password-only authentication was rejected." },
    { id: "policy_access_control", type: "policy", label: "Access Control Policy", assurance: "validated", provenance: provenance("engagement://acme/policy/state"), summary: "Requires MFA for privileged access." },
    { id: "requirement_asvs_auth", type: "requirement", label: "Strong privileged authentication", assurance: "validated", provenance: provenance("engagement://acme/requirement/state"), summary: "Privileged administrative access requires appropriately strong authentication." },
    { id: "framework_owasp_asvs", type: "framework", label: "OWASP ASVS", assurance: "unknown", summary: "Application Security Verification Standard used as an assessment reference." },
  ],
  edges: [
    { id: "edge_objective_app", source: "objective_protect_customers", target: "app_acme_orders", type: "supports", state: "verified", provenance: provenance("engagement://acme/objective/1") },
    { id: "edge_app_asset", source: "app_acme_orders", target: "asset_customer_db", type: "depends_on", state: "verified", provenance: provenance("engagement://acme/architecture/1") },
    { id: "edge_app_identity", source: "app_acme_orders", target: "identity_admin", type: "accessed_by", state: "verified", provenance: provenance("engagement://acme/identity/1") },
    { id: "edge_threat_app", source: "threat_credential_attack", target: "app_acme_orders", type: "targets", state: "verified", provenance: provenance("engagement://acme/threat/1") },
    { id: "edge_finding_risk", source: "finding_password_only", target: "risk_admin_compromise", type: "creates_risk", state: "verified", provenance: provenance("engagement://acme/finding/1") },
    { id: "edge_app_risk", source: "app_acme_orders", target: "risk_admin_compromise", type: "affected_by", state: "verified", provenance: provenance("engagement://acme/risk/1") },
    { id: "edge_risk_control", source: "risk_admin_compromise", target: "control_admin_mfa", type: "mitigated_by", state: "verified", provenance: provenance("engagement://acme/control/1") },
    { id: "edge_control_validation", source: "control_admin_mfa", target: "validation_mfa_login", type: "validated_by", state: "verified", provenance: provenance("engagement://acme/validation/1") },
    { id: "edge_validation_evidence", source: "validation_mfa_login", target: "evidence_mfa_test", type: "supported_by", state: "verified", provenance: provenance("engagement://acme/evidence/1") },
    { id: "edge_evidence_requirement", source: "evidence_mfa_test", target: "requirement_asvs_auth", type: "supports", state: "verified", provenance: provenance("engagement://acme/mapping/1") },
    { id: "edge_requirement_framework", source: "requirement_asvs_auth", target: "framework_owasp_asvs", type: "required_by", state: "verified", provenance: provenance("https://owasp.org/www-project-application-security-verification-standard/") },
    { id: "edge_control_policy", source: "control_admin_mfa", target: "policy_access_control", type: "implemented_by", state: "proposed", provenance: proposedProvenance("client-document://acme/access-control-policy") },
  ],
};
