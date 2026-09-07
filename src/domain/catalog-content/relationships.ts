type CuratedRelationship = {
  id: `relationship_${string}`;
  source: string;
  target: string;
  type: "related_to" | "implements";
  status: "eidos_curated";
  provenance: {
    authority: "non_authoritative";
    sourceLabel: string;
    rationale: string;
  };
};

function related(
  id: CuratedRelationship["id"],
  source: string,
  target: string,
  rationale: string,
): CuratedRelationship {
  return {
    id,
    source,
    target,
    type: "related_to",
    status: "eidos_curated",
    provenance: { authority: "non_authoritative", sourceLabel: "Eidos editorial context", rationale },
  };
}

export const additionalCuratedRelationships = [
  related("relationship_cmmc_nist_171_context", "regulation_cmmc_32_cfr_170", "catalog_nist_sp_800_171_rev_3", "CMMC and NIST SP 800-171 are commonly considered together for Defense Industrial Base security planning; this orientation does not establish scope, assessment outcome, or compliance."),
  related("relationship_dfars_nist_171_context", "regulation_dfars_252_204_7012", "catalog_nist_sp_800_171_rev_3", "The DFARS clause and NIST SP 800-171 are commonly reviewed together for covered defense information; this is not a clause-level mapping or applicability determination."),
  related("relationship_cmmc_dfars_context", "regulation_cmmc_32_cfr_170", "regulation_dfars_252_204_7012", "Both records are relevant to portions of the Defense Industrial Base, but contractual and regulatory scope must be determined from authoritative acquisition context."),
  related("relationship_rmf_800_53_context", "framework_nist_rmf", "catalog_nist_sp_800_53_rev_5", "NIST RMF describes a risk-management lifecycle and SP 800-53 provides a control catalog often used within that lifecycle; no system authorization outcome is asserted."),
  related("relationship_fisma_rmf_context", "regulation_fisma_2014", "framework_nist_rmf", "Federal information-security governance and NIST RMF are commonly considered together; this relationship is orientation rather than legal interpretation."),
  related("relationship_fedramp_800_53_context", "catalog_fedramp_rev_5_baselines", "catalog_nist_sp_800_53_rev_5", "FedRAMP baselines draw on NIST control families for cloud authorization contexts; Eidos does not provide an authoritative control crosswalk here."),
  related("relationship_iso_27001_27002_context", "standard_iso_27001_2022", "standard_iso_27002_2022", "ISO/IEC 27001 defines management-system requirements while ISO/IEC 27002 provides information-security control guidance; users should verify licensed publisher material."),
  related("relationship_iso_27001_27701_context", "standard_iso_27001_2022", "standard_iso_27701_2025", "ISO/IEC 27701 extends management-system context toward privacy information management; this relationship does not establish certification or legal compliance."),
  related("relationship_iso_27001_27017_context", "standard_iso_27001_2022", "standard_iso_27017_2015", "ISO/IEC 27017 adds cloud-security guidance relevant to organizations using ISO/IEC 27001; this is not a certification-scope decision."),
  related("relationship_iso_27001_27018_context", "standard_iso_27001_2022", "standard_iso_27018_2019", "ISO/IEC 27018 adds public-cloud PII protection guidance relevant to privacy and cloud programs; legal and certification applicability remains context-specific."),
  related("relationship_ai_rmf_ai_policy_context", "framework_nist_ai_rmf", "policy_ai_governance_acceptable_use", "NIST AI RMF can inform risk conversations while the Eidos policy offers an editable governance starting point; the policy is not publisher-backed implementation guidance."),
  related("relationship_ssdf_secure_development_context", "framework_nist_ssdf", "policy_secure_development_application_security", "NIST SSDF can inform secure-development planning while the Eidos policy provides editorial starter decisions and actions; no conformity claim is made."),
  related("relationship_asvs_secure_development_context", "catalog_owasp_asvs_5", "policy_secure_development_application_security", "OWASP ASVS can support application-security verification planning while the Eidos policy provides governance context; no requirement-level mapping is asserted."),
  related("relationship_ccm_cloud_policy_context", "catalog_csa_ccm_4_1", "policy_cloud_security", "CSA CCM can inform cloud-control discussions while the Eidos cloud policy provides editorial starter governance; the relationship does not establish assurance or certification."),
  related("relationship_ztmm_zero_trust_context", "framework_cisa_zero_trust_maturity", "concept_zero_trust", "The CISA maturity model provides publisher guidance related to the broader zero-trust concept; Eidos does not reduce the model to a product checklist."),
  related("relationship_ferpa_privacy_policy_context", "regulation_ferpa", "policy_privacy_personal_data_protection", "FERPA may influence education privacy governance while the Eidos policy provides a general editorial starting point; applicability requires qualified review."),
  related("relationship_ftc_risk_policy_context", "regulation_ftc_safeguards", "policy_cybersecurity_risk_management", "The FTC Safeguards Rule can affect financial-institution security programs while the Eidos policy offers general risk-governance starter guidance; no applicability or compliance claim is made."),
  related("relationship_dora_resilience_policy_context", "regulation_eu_dora", "policy_technology_resilience_backup_disaster_recovery", "DORA addresses digital operational resilience in defined financial contexts while the Eidos policy provides a broader editorial resilience starting point."),
  related("relationship_nerc_resilience_policy_context", "standard_nerc_cip", "policy_technology_resilience_backup_disaster_recovery", "NERC CIP standards and technology-resilience policy may be considered together in relevant bulk-electric-system contexts; Eidos does not determine entity registration or obligation."),
  related("relationship_cpg_governance_policy_context", "catalog_cisa_cpg", "policy_information_security_governance", "CISA CPGs provide prioritized practices while the Eidos governance policy provides an editorial accountability structure; no official implementation relationship is asserted."),
  related("relationship_hitrust_hipaa_context", "framework_hitrust_csf", "regulation_hipaa_security_rule", "HITRUST CSF and the HIPAA Security Rule are commonly encountered in healthcare assurance conversations, but they have different authorities and one does not automatically establish compliance with the other."),
  related("relationship_c2m2_risk_policy_context", "framework_c2m2", "policy_cybersecurity_risk_management", "C2M2 can support capability discussions while the Eidos risk policy provides general governance starter guidance; no maturity level or sector obligation is inferred."),
  related("relationship_privacy_framework_privacy_policy_context", "framework_nist_privacy", "policy_privacy_personal_data_protection", "The NIST Privacy Framework can inform privacy-risk discussions while the Eidos policy provides an editorial governance starting point; no legal applicability or conformity claim is made."),
  related("relationship_cobit_governance_policy_context", "framework_cobit_2019", "policy_information_security_governance", "COBIT can inform enterprise technology governance while the Eidos policy provides a narrower security-governance starting point; no COBIT alignment claim is made."),
  related("relationship_attack_logging_policy_context", "framework_mitre_attack", "policy_logging_monitoring_alerting", "MITRE ATT&CK can inform detection and monitoring discussions while the Eidos policy addresses governance decisions; this is not a technique-to-control mapping."),
  related("relationship_nice_awareness_policy_context", "framework_nice_workforce", "policy_security_awareness_acceptable_use", "The NICE Workforce Framework can inform role and capability discussions while the Eidos policy addresses workforce expectations and awareness governance."),
  related("relationship_nydfs_risk_policy_context", "regulation_nydfs_part_500", "policy_cybersecurity_risk_management", "NYDFS Part 500 may influence risk-program governance for covered entities while the Eidos policy remains general editorial guidance; applicability requires qualified review."),
  related("relationship_nis2_incident_policy_context", "regulation_eu_nis2", "policy_incident_response", "NIS2 may influence incident governance for in-scope entities while the Eidos policy offers a general starting point; this relationship does not determine scope or reporting obligations."),
  related("relationship_iso_22301_resilience_policy_context", "standard_iso_22301_2019", "policy_technology_resilience_backup_disaster_recovery", "ISO 22301 addresses business-continuity management while the Eidos policy offers technology-resilience starters; certification and scope remain separate decisions."),
  related("relationship_iec_62443_network_policy_context", "standard_iec_62443_series", "policy_network_security", "IEC 62443 addresses industrial automation and control-system security while the Eidos network policy provides broader editorial governance guidance."),
  related("relationship_aicpa_governance_policy_context", "standard_aicpa_trust_services_criteria", "policy_information_security_governance", "The Trust Services Criteria can inform assurance discussions while the Eidos policy addresses internal governance; no SOC examination outcome is implied."),
  related("relationship_cis_benchmarks_configuration_policy_context", "catalog_cis_benchmarks", "policy_secure_configuration_change_control", "CIS Benchmarks can inform configuration baselines while the Eidos policy establishes editorial governance decisions; no benchmark-conformance claim is made."),
  related("relationship_asset_control_policy_context", "control_authoritative_asset_inventory_process", "policy_asset_management", "The inventory control is one possible operational expression of the Eidos asset policy and must be tailored to organizational scope."),
  related("relationship_vulnerability_control_policy_context", "control_vulnerability_remediation", "policy_vulnerability_patch_management", "The remediation control illustrates an operational practice relevant to the Eidos vulnerability and patch policy; it does not prescribe service levels."),
  related("relationship_configuration_control_policy_context", "control_secure_configuration_baseline", "policy_secure_configuration_change_control", "The baseline control illustrates one way to operate the Eidos configuration policy; platform-specific settings require separate engineering review."),
  related("relationship_backup_control_resilience_policy_context", "control_tested_backup_restoration", "policy_technology_resilience_backup_disaster_recovery", "The restoration control illustrates one operational practice within the broader Eidos technology-resilience policy."),
  related("relationship_logging_control_policy_context", "control_centralized_security_logging", "policy_logging_monitoring_alerting", "The centralized logging control illustrates one implementation option for the Eidos logging policy; retention and coverage remain context-specific."),
  related("relationship_edr_control_endpoint_policy_context", "control_endpoint_detection_and_response", "policy_endpoint_remote_work_security", "The endpoint-detection control illustrates one possible safeguard within the broader Eidos endpoint and remote-work policy."),
  related("relationship_defense_in_depth_network_policy_context", "concept_defense_in_depth", "policy_network_security", "Defense in depth helps explain why the Eidos network policy uses multiple complementary safeguards rather than relying on one boundary control."),
  related("relationship_shared_responsibility_cloud_policy_context", "concept_shared_responsibility_model", "policy_cloud_security", "Shared responsibility helps frame cloud accountability decisions in the Eidos cloud policy; provider and customer duties must be verified per service."),
  related("relationship_risk_appetite_risk_policy_context", "concept_risk_appetite_and_tolerance", "policy_cybersecurity_risk_management", "Risk appetite and tolerance help frame escalation and acceptance decisions described by the Eidos risk policy."),
  related("relationship_residual_risk_policy_context", "concept_inherent_versus_residual_risk", "policy_cybersecurity_risk_management", "The inherent-versus-residual distinction helps explain assessment and treatment decisions described by the Eidos risk policy."),
  related("relationship_security_baseline_configuration_policy_context", "concept_security_baseline", "policy_secure_configuration_change_control", "The baseline concept provides context for the approved configuration states governed by the Eidos configuration policy."),
  related("relationship_data_classification_policy_context", "concept_data_classification", "policy_data_lifecycle", "Data classification helps drive handling, retention, transfer, and disposal decisions in the Eidos data-lifecycle policy."),
  related("relationship_third_party_iso_context", "policy_third_party_supply_chain_security", "standard_iso_27001_2022", "ISO/IEC 27001 includes supplier-relationship context relevant to third-party governance; this Eidos relationship is not a control mapping or certification claim."),
  related("relationship_cryptography_iso_context", "policy_cryptography_key_management", "standard_iso_27001_2022", "ISO/IEC 27001 includes information-security control context relevant to cryptography while the Eidos policy provides editorial implementation decisions."),
  related("relationship_physical_iso_context", "policy_physical_security", "standard_iso_27001_2022", "ISO/IEC 27001 includes physical-security control context while the Eidos policy provides a general editorial starting point; no control-level mapping is asserted."),
] as const;
