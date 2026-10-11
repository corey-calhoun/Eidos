type ExternalRecordSeed = {
  id: string;
  slug: string;
  name: string;
  acronym?: string;
  type: "framework" | "regulation" | "standard" | "control_catalog" | "law" | "contract_clause" | "guidance" | "criteria" | "knowledge_base";
  summary: string;
  description: string;
  issuer: string;
  jurisdictions: string[];
  industries: string[];
  applicability: string;
  version?: string;
  publicationDate?: string;
  effectiveDate?: string;
  officialUrl: string;
  domains: string[];
  tags: string[];
};

function external<const T extends ExternalRecordSeed>(record: T, status: "current" | "superseded" = "current") {
  return { ...record, status };
}

export const additionalExternalRecords = [
  external({
    id: "framework_nist_csf_1_1", slug: "nist-csf-1-1", name: "NIST Cybersecurity Framework 1.1", acronym: "NIST CSF", type: "framework",
    summary: "The superseded 2018 revision of NIST's voluntary framework for managing cybersecurity risk.",
    description: "NIST CSF 1.1 organized cybersecurity outcomes around Identify, Protect, Detect, Respond, and Recover. Eidos retains this metadata-only historical record so users can distinguish it from CSF 2.0.",
    issuer: "U.S. National Institute of Standards and Technology", jurisdictions: ["United States", "global"], industries: ["cross-industry"],
    applicability: "Historical reference for organizations interpreting material written against CSF 1.1; new adoption decisions should verify the current NIST publication.", version: "1.1", publicationDate: "2018-04-16",
    officialUrl: "https://nvlpubs.nist.gov/nistpubs/CSWP/NIST.CSWP.04162018.pdf", domains: ["cybersecurity", "risk management", "governance"], tags: ["historical version", "framework core", "profiles", "implementation tiers"],
  }, "superseded"),
  external({
    id: "framework_nist_privacy", slug: "nist-privacy-framework", name: "NIST Privacy Framework", acronym: "NIST PF", type: "framework",
    summary: "A voluntary tool for identifying and managing privacy risk through enterprise risk-management practices.",
    description: "The NIST Privacy Framework provides outcome-oriented Core, Profile, and Implementation Tier concepts that organizations use to communicate and manage privacy risk without prescribing one implementation method. Version 1.0 was published January 16, 2020. NIST released PF 1.1 as an Initial Public Draft in 2024; the Eidos record reflects the current 1.0 framework while users should monitor for 1.1 finalization.",
    issuer: "U.S. National Institute of Standards and Technology", jurisdictions: ["United States", "global"], industries: ["cross-industry"],
    applicability: "Organizations seeking a common structure for privacy-risk conversations and activities; selection does not establish a legal obligation.", version: "1.0", publicationDate: "2020-01-16",
    officialUrl: "https://www.nist.gov/privacy-framework", domains: ["privacy", "risk management", "governance"], tags: ["privacy risk", "profiles", "outcomes"],
  }),
  external({
    id: "framework_nist_ai_rmf", slug: "nist-ai-rmf-1-0", name: "NIST AI Risk Management Framework", acronym: "AI RMF", type: "framework",
    summary: "A voluntary framework for managing risks to individuals, organizations, and society from artificial-intelligence systems.",
    description: "AI RMF 1.0 organizes AI risk-management activity around Govern, Map, Measure, and Manage functions and emphasizes trustworthy and responsible AI characteristics.",
    issuer: "U.S. National Institute of Standards and Technology", jurisdictions: ["United States", "global"], industries: ["cross-industry", "technology-saas"],
    applicability: "Organizations designing, developing, deploying, acquiring, or governing AI systems; it does not itself determine regulatory applicability.", version: "1.0", publicationDate: "2023-01-26",
    officialUrl: "https://www.nist.gov/itl/ai-risk-management-framework", domains: ["AI governance", "risk management", "assurance"], tags: ["trustworthy AI", "AI risk", "Govern Map Measure Manage"],
  }),
  external({
    id: "framework_nist_rmf", slug: "nist-risk-management-framework", name: "NIST Risk Management Framework", acronym: "NIST RMF", type: "framework",
    summary: "A structured life-cycle process for managing security and privacy risk in information systems and organizations.",
    description: "NIST SP 800-37 Revision 2 describes RMF activities for preparing, categorizing, selecting, implementing, assessing, authorizing, and continuously monitoring controls.",
    issuer: "U.S. National Institute of Standards and Technology", jurisdictions: ["United States"], industries: ["government", "cross-industry"],
    applicability: "Federal and other organizations choosing to use the RMF; sector selection alone does not establish a mandate.", version: "SP 800-37 Revision 2", publicationDate: "2018-12-20",
    officialUrl: "https://csrc.nist.gov/pubs/sp/800/37/r2/final", domains: ["risk management", "security authorization", "privacy"], tags: ["system life cycle", "authorization", "continuous monitoring"],
  }),
  external({
    id: "framework_cobit_2019", slug: "cobit-2019", name: "COBIT 2019", acronym: "COBIT", type: "framework",
    summary: "A framework for enterprise governance and management of information and technology.",
    description: "COBIT provides governance-system components, objectives, design factors, and performance-management concepts for aligning information and technology with enterprise needs.",
    issuer: "ISACA", jurisdictions: ["global"], industries: ["cross-industry", "professional-services", "financial-services"],
    applicability: "Organizations designing or improving governance of enterprise information and technology; use does not establish certification or compliance.", version: "2019",
    officialUrl: "https://www.isaca.org/resources/cobit", domains: ["IT governance", "risk management", "assurance"], tags: ["governance system", "management objectives", "enterprise IT"],
  }),
  external({
    id: "framework_hitrust_csf", slug: "hitrust-csf", name: "HITRUST CSF", acronym: "HITRUST CSF", type: "framework",
    summary: "A certifiable risk and compliance framework that harmonizes security and privacy requirements from multiple sources.",
    description: "The HITRUST CSF organizes security and privacy controls and assessment requirements into a framework used particularly in healthcare and other regulated environments.",
    issuer: "HITRUST Alliance", jurisdictions: ["United States", "global"], industries: ["healthcare", "financial-services", "cross-industry"],
    applicability: "Organizations choosing HITRUST assessments or using its framework; Eidos does not determine certification scope or eligibility.",
    officialUrl: "https://hitrustalliance.net/hitrust-framework", domains: ["information security", "privacy", "assurance"], tags: ["HITRUST", "assessment", "harmonization"],
  }),
  external({
    id: "framework_c2m2", slug: "cybersecurity-capability-maturity-model-2-1", name: "Cybersecurity Capability Maturity Model", acronym: "C2M2", type: "framework",
    summary: "A voluntary maturity model for evaluating and improving cybersecurity capabilities.",
    description: "C2M2 Version 2.1 provides domains, objectives, and maturity indicator levels for self-evaluating cybersecurity practices and prioritizing capability improvements.",
    issuer: "U.S. Department of Energy", jurisdictions: ["United States"], industries: ["critical-infrastructure", "cross-industry"],
    applicability: "Organizations conducting voluntary cybersecurity capability evaluations, including energy and critical-infrastructure organizations.", version: "2.1", publicationDate: "2022-06-01",
    officialUrl: "https://www.energy.gov/ceser/cybersecurity-capability-maturity-model-c2m2", domains: ["cybersecurity maturity", "risk management", "critical infrastructure"], tags: ["self-evaluation", "maturity indicators", "capability improvement"],
  }),
  external({
    id: "framework_cisa_zero_trust_maturity", slug: "cisa-zero-trust-maturity-model-2-0", name: "CISA Zero Trust Maturity Model", acronym: "ZTMM", type: "guidance",
    summary: "A maturity model describing stages and cross-cutting capabilities for progressing toward zero-trust architectures.",
    description: "Version 2.0 describes traditional, initial, advanced, and optimal maturity across identity, devices, networks, applications and workloads, and data.",
    issuer: "Cybersecurity and Infrastructure Security Agency", jurisdictions: ["United States"], industries: ["government", "critical-infrastructure", "cross-industry"],
    applicability: "Federal agencies and other organizations using the model as an orientation aid; it is one roadmap rather than a universal mandate.", version: "2.0", publicationDate: "2023-04-11",
    officialUrl: "https://www.cisa.gov/resources-tools/resources/zero-trust-maturity-model", domains: ["zero trust", "identity", "architecture"], tags: ["maturity model", "devices", "data"],
  }),
  external({
    id: "framework_mitre_attack", slug: "mitre-attack", name: "MITRE ATT&CK", acronym: "ATT&CK", type: "knowledge_base",
    summary: "A publicly available knowledge base of adversary tactics and techniques based on real-world observations.",
    description: "MITRE ATT&CK organizes adversary behavior for enterprise, mobile, and industrial-control contexts and supports threat-informed defense, detection, and assessment work.",
    issuer: "MITRE Corporation", jurisdictions: ["global"], industries: ["cross-industry", "technology-saas", "critical-infrastructure"],
    applicability: "Defenders, threat analysts, detection engineers, and assessors using a common adversary-behavior vocabulary; ATT&CK does not itself define compliance.",
    officialUrl: "https://attack.mitre.org/", domains: ["threat intelligence", "detection", "adversary behavior"], tags: ["tactics", "techniques", "threat-informed defense"],
  }),
  external({
    id: "framework_nice_workforce", slug: "nice-workforce-framework", name: "NICE Workforce Framework for Cybersecurity", acronym: "NICE Framework", type: "framework",
    summary: "A common language for describing cybersecurity work, roles, competencies, knowledge, and skills.",
    description: "The NICE Framework supports workforce planning, education, hiring, development, and communication by organizing cybersecurity work through standardized concepts.",
    issuer: "U.S. National Institute of Standards and Technology", jurisdictions: ["United States", "global"], industries: ["cross-industry", "education", "government"],
    applicability: "Employers, educators, learners, workforce planners, and public agencies using a common cybersecurity-workforce vocabulary.", version: "NIST SP 800-181 Revision 1",
    officialUrl: "https://www.nist.gov/itl/applied-cybersecurity/nice/nice-framework-resource-center", domains: ["workforce", "education", "governance"], tags: ["work roles", "competencies", "skills"],
  }),
  external({
    id: "framework_nist_ssdf", slug: "nist-secure-software-development-framework-1-1", name: "NIST Secure Software Development Framework", acronym: "SSDF", type: "framework",
    summary: "A set of high-level secure-software-development practices that can be integrated into software development life cycles.",
    description: "NIST SP 800-218 groups practices around preparing the organization, protecting software, producing well-secured software, and responding to vulnerabilities.",
    issuer: "U.S. National Institute of Standards and Technology", jurisdictions: ["United States", "global"], industries: ["technology-saas", "cross-industry"],
    applicability: "Software producers, acquirers, and technology organizations tailoring secure-development practices to their risks and life cycles.", version: "1.1", publicationDate: "2022-02-03",
    officialUrl: "https://csrc.nist.gov/pubs/sp/800/218/final", domains: ["application security", "software supply chain", "secure development"], tags: ["SDLC", "software vulnerabilities", "SSDF"],
  }),
  external({
    id: "regulation_cmmc_32_cfr_170", slug: "cmmc-32-cfr-part-170", name: "Cybersecurity Maturity Model Certification Program Rule", acronym: "CMMC", type: "regulation",
    summary: "The U.S. Department of Defense program rule establishing CMMC assessment and affirmation requirements for specified defense-contract contexts.",
    description: "32 CFR Part 170 establishes the CMMC program structure, levels, assessment requirements, affirmations, and related processes. On July 13, 2026 the Department of War announced an immediate suspension of CMMC Phase II requirements pending a comprehensive review of the program; Phase I self-assessment requirements remain in place. Contract-specific obligations require separate review of applicable solicitations, contracts, and program requirements.",
    issuer: "U.S. Department of Defense", jurisdictions: ["United States"], industries: ["defense-industrial-base"],
    applicability: "Defense contractors and subcontractors only where applicable solicitations, contracts, information categories, and program requirements bring them into scope; Eidos does not decide scope. Phase II is currently suspended; Phase I self-assessment remains in force.", version: "32 CFR Part 170", effectiveDate: "2024-12-16",
    officialUrl: "https://dodcio.defense.gov/CMMC/", domains: ["defense contracting", "CUI protection", "assessment"], tags: ["CMMC levels", "affirmation", "DoD", "Phase II suspension"],
  }),
  external({
    id: "regulation_dfars_252_204_7012", slug: "dfars-252-204-7012", name: "DFARS 252.204-7012 Safeguarding Covered Defense Information", acronym: "DFARS 252.204-7012", type: "contract_clause",
    summary: "A Defense Federal Acquisition Regulation Supplement clause addressing covered defense information and cyber-incident reporting.",
    description: "The clause addresses safeguarding covered defense information, reporting covered cyber incidents, preserving images and data, malicious-software submission, and flow-down conditions.",
    issuer: "U.S. Department of Defense", jurisdictions: ["United States"], industries: ["defense-industrial-base"],
    applicability: "Contracts and subcontracts containing the clause, subject to its text and definitions; selecting Defense/DoD in Eidos does not establish contractual applicability.", version: "DFARS 252.204-7012",
    officialUrl: "https://www.acquisition.gov/dfars/part-252-solicitation-provisions-and-contract-clauses", domains: ["defense contracting", "incident reporting", "CUI protection"], tags: ["covered defense information", "cyber incident", "flow-down"],
  }),
  external({
    id: "regulation_fisma_2014", slug: "fisma-2014", name: "Federal Information Security Modernization Act of 2014", acronym: "FISMA", type: "law",
    summary: "A U.S. federal law defining agency information-security responsibilities, oversight, and reporting.",
    description: "FISMA 2014 amended federal information-security requirements and assigns responsibilities across agencies, the Office of Management and Budget, the Department of Homeland Security, and NIST.",
    issuer: "United States Congress", jurisdictions: ["United States"], industries: ["government"],
    applicability: "Federal-agency information-security programs and related contexts defined by law and implementing policy; Eidos provides orientation rather than a legal determination.", version: "Public Law 113-283", publicationDate: "2014-12-18",
    officialUrl: "https://www.congress.gov/113/plaws/publ283/PLAW-113publ283.pdf", domains: ["federal cybersecurity", "oversight", "risk management"], tags: ["agency security programs", "OMB", "DHS"],
  }),
  external({
    id: "regulation_ferpa", slug: "ferpa", name: "Family Educational Rights and Privacy Act", acronym: "FERPA", type: "law",
    summary: "A U.S. federal law protecting the privacy of student education records.",
    description: "FERPA establishes rights and conditions governing access to and disclosure of education records for covered educational agencies and institutions.",
    issuer: "U.S. Department of Education", jurisdictions: ["United States"], industries: ["education"],
    applicability: "Educational agencies and institutions receiving applicable U.S. Department of Education funds, subject to statutory and regulatory definitions.",
    officialUrl: "https://studentprivacy.ed.gov/ferpa", domains: ["student privacy", "data governance", "education"], tags: ["education records", "consent", "student rights"],
  }),
  external({
    id: "regulation_ftc_safeguards", slug: "ftc-safeguards-rule", name: "FTC Safeguards Rule", acronym: "Safeguards Rule", type: "regulation",
    summary: "A U.S. Federal Trade Commission rule requiring covered financial institutions to maintain safeguards for customer information.",
    description: "The Safeguards Rule under the Gramm-Leach-Bliley Act addresses written information-security programs, risk assessment, safeguards, service providers, evaluation, and reporting for covered financial institutions. Originally effective 2003; revised 2021 to provide more concrete guidance; further amended in 2023 to add breach notification requirements (effective May 13, 2024).",
    issuer: "U.S. Federal Trade Commission", jurisdictions: ["United States"], industries: ["financial-services", "professional-services", "education"],
    applicability: "Entities meeting the rule's definition of financial institution and related conditions; Eidos does not decide whether an organization is covered.", version: "16 CFR Part 314",
    officialUrl: "https://www.ftc.gov/business-guidance/resources/ftc-safeguards-rule-what-your-business-needs-know", domains: ["financial privacy", "information security", "third-party risk"], tags: ["GLBA", "customer information", "security program", "breach notification"],
  }),
  external({
    id: "regulation_nydfs_part_500", slug: "nydfs-23-nycrr-500", name: "NYDFS Cybersecurity Regulation", acronym: "23 NYCRR Part 500", type: "regulation",
    summary: "New York cybersecurity requirements for covered financial-services companies supervised by the Department of Financial Services.",
    description: "Part 500 establishes cybersecurity-program, policy, risk-assessment, governance, incident-notification, and technical requirements. The original regulation was promulgated March 1, 2017; the Second Amendment to Part 500 was adopted by DFS and took effect upon publication in the State Register, with phased compliance dates for amended provisions. Covered entities must track the current amendment schedule.",
    issuer: "New York State Department of Financial Services", jurisdictions: ["New York", "United States"], industries: ["financial-services"],
    applicability: "Entities that meet the regulation's covered-entity definition, subject to exemptions and current amendment provisions; Eidos does not determine coverage.", version: "23 NYCRR Part 500 (Second Amendment)",
    officialUrl: "https://www.dfs.ny.gov/cybersecurity", domains: ["financial cybersecurity", "risk management", "incident reporting"], tags: ["covered entities", "New York", "cybersecurity program", "Second Amendment"],
  }),
  external({
    id: "regulation_eu_nis2", slug: "eu-nis2-directive", name: "Directive on Measures for a High Common Level of Cybersecurity Across the Union", acronym: "NIS2", type: "regulation",
    summary: "An EU directive establishing cybersecurity risk-management and reporting measures for covered essential and important entities.",
    description: "Directive (EU) 2022/2555 addresses national cybersecurity capabilities, cooperation, entity risk-management measures, incident reporting, supervision, and enforcement.",
    issuer: "European Parliament and Council of the European Union", jurisdictions: ["European Union", "European Economic Area"], industries: ["critical-infrastructure", "technology-saas", "cross-industry"],
    applicability: "Entities within national laws implementing NIS2, based on sector, size, role, and jurisdiction; the directive and national implementation must be reviewed separately.", version: "Directive (EU) 2022/2555",
    officialUrl: "https://eur-lex.europa.eu/eli/dir/2022/2555/oj", domains: ["cybersecurity risk", "incident reporting", "critical infrastructure"], tags: ["essential entities", "important entities", "EU directive"],
  }),
  external({
    id: "regulation_eu_dora", slug: "eu-digital-operational-resilience-act", name: "Digital Operational Resilience Act", acronym: "DORA", type: "regulation",
    summary: "An EU regulation addressing digital operational resilience in the financial sector.",
    description: "Regulation (EU) 2022/2554 covers ICT risk management, incident reporting, resilience testing, information sharing, and third-party ICT risk for in-scope financial entities.",
    issuer: "European Parliament and Council of the European Union", jurisdictions: ["European Union", "European Economic Area"], industries: ["financial-services"],
    applicability: "Financial entities and ICT third-party contexts defined by DORA and related instruments; Eidos does not determine entity scope.", version: "Regulation (EU) 2022/2554", effectiveDate: "2025-01-17",
    officialUrl: "https://eur-lex.europa.eu/eli/reg/2022/2554/oj", domains: ["operational resilience", "third-party risk", "incident reporting"], tags: ["ICT risk", "resilience testing", "financial entities"],
  }),
  external({
    id: "standard_iso_27002_2022", slug: "iso-iec-27002-2022", name: "ISO/IEC 27002:2022", acronym: "ISO 27002", type: "standard",
    summary: "Guidance for information-security controls used with an information security management system or other risk-based program.",
    description: "ISO/IEC 27002:2022 provides control guidance and attributes. Eidos stores only metadata and a short paraphrase because the standard text is licensed.",
    issuer: "International Organization for Standardization and International Electrotechnical Commission", jurisdictions: ["global"], industries: ["cross-industry"],
    applicability: "Organizations selecting and implementing information-security controls; use does not by itself confer ISO/IEC 27001 certification.", version: "2022",
    officialUrl: "https://www.iso.org/standard/75652.html", domains: ["information security controls", "ISMS", "risk treatment"], tags: ["control guidance", "ISO 27000 family", "attributes"],
  }),
  external({
    id: "standard_iso_27701_2025", slug: "iso-iec-27701-2025", name: "ISO/IEC 27701:2025", acronym: "ISO 27701", type: "standard",
    summary: "Requirements and guidance for establishing and improving a privacy information management system.",
    description: "ISO/IEC 27701 extends management-system practices for privacy information management. Eidos does not reproduce the licensed standard text.",
    issuer: "International Organization for Standardization and International Electrotechnical Commission", jurisdictions: ["global"], industries: ["cross-industry"],
    applicability: "Organizations acting in privacy-relevant roles and choosing to implement a privacy information management system; legal obligations remain jurisdiction-specific.", version: "2025",
    officialUrl: "https://www.iso.org/standard/85819.html", domains: ["privacy", "management systems", "data governance"], tags: ["PIMS", "privacy controls", "ISO 27000 family"],
  }),
  external({
    id: "standard_iso_22301_2019", slug: "iso-22301-2019", name: "ISO 22301:2019", acronym: "ISO 22301", type: "standard",
    summary: "An international standard specifying requirements for a business continuity management system.",
    description: "ISO 22301 addresses planning, establishing, implementing, operating, monitoring, reviewing, maintaining, and improving business continuity arrangements. ISO 22301:2019/Amd 1:2024 added climate action changes; the standard is currently scheduled for revision.",
    issuer: "International Organization for Standardization and International Electrotechnical Commission", jurisdictions: ["global"], industries: ["cross-industry", "critical-infrastructure"],
    applicability: "Organizations choosing a management-system approach to continuity and resilience; Eidos does not reproduce licensed requirements.", version: "2019 / Amd 1:2024",
    officialUrl: "https://www.iso.org/standard/75106.html", domains: ["business continuity", "resilience", "management systems"], tags: ["BCMS", "disruption", "recovery", "climate action"],
  }),
  external({
    id: "standard_iso_27017_2015", slug: "iso-iec-27017-2015", name: "ISO/IEC 27017:2015", acronym: "ISO 27017", type: "standard",
    summary: "The withdrawn 2015 edition of ISO/IEC 27017 cloud-security control guidance.",
    description: "ISO/IEC 27017:2015 provided cloud-specific implementation guidance and additional controls alongside ISO/IEC 27002. The standard was withdrawn on 2026-07-27 and superseded by ISO/IEC 27017:2026, which is aligned to ISO/IEC 27002:2022. Eidos retains this metadata-only historical record so users can distinguish it from the current edition.",
    issuer: "International Organization for Standardization and International Electrotechnical Commission", jurisdictions: ["global"], industries: ["technology-saas", "cross-industry"],
    applicability: "Historical reference for organizations interpreting material written against ISO/IEC 27017:2015; new adoption decisions should reference ISO/IEC 27017:2026.", version: "2015", publicationDate: "2015-12-15",
    officialUrl: "https://www.iso.org/standard/27017", domains: ["cloud security", "information security controls", "shared responsibility"], tags: ["cloud services", "provider", "customer", "historical version"],
  }, "superseded"),
  external({
    id: "standard_iso_27018_2019", slug: "iso-iec-27018-2019", name: "ISO/IEC 27018:2019", acronym: "ISO 27018", type: "standard",
    summary: "The withdrawn 2019 edition of ISO/IEC 27018 guidance for protecting PII in public-cloud environments.",
    description: "ISO/IEC 27018:2019 provided privacy-related control guidance for public-cloud service providers acting as processors of personally identifiable information. The standard was withdrawn on 2025-08-26 and superseded by ISO/IEC 27018:2025, which is aligned to ISO/IEC 27002:2022 and includes a new Annex B with additional implementation guidance.",
    issuer: "International Organization for Standardization and International Electrotechnical Commission", jurisdictions: ["global"], industries: ["technology-saas", "cross-industry"],
    applicability: "Historical reference for organizations interpreting material written against ISO/IEC 27018:2019; new adoption decisions should reference ISO/IEC 27018:2025.", version: "2019", publicationDate: "2019-01-15",
    officialUrl: "https://www.iso.org/standard/27018", domains: ["cloud privacy", "personal information", "information security controls"], tags: ["public cloud", "PII", "processor", "historical version"],
  }, "superseded"),
  external({
    id: "standard_iso_27017_2026", slug: "iso-iec-27017-2026", name: "ISO/IEC 27017:2026", acronym: "ISO 27017", type: "standard",
    summary: "Cloud-security control guidance based on ISO/IEC 27002 for cloud service customers and providers.",
    description: "ISO/IEC 27017:2026 (Edition 2) builds on ISO/IEC 27002:2022 by adding cloud-specific implementation guidance and additional controls addressing shared responsibility, incident handling, and provider-customer relationships across public, private, and hybrid cloud deployments.",
    issuer: "International Organization for Standardization and International Electrotechnical Commission", jurisdictions: ["global"], industries: ["technology-saas", "cross-industry"],
    applicability: "Cloud service providers and customers choosing to apply the guidance; contractual and regulatory obligations require separate analysis.", version: "2026", publicationDate: "2026-07-27",
    officialUrl: "https://www.iso.org/standard/27017", domains: ["cloud security", "information security controls", "shared responsibility"], tags: ["cloud services", "provider", "customer", "shared responsibility"],
  }),
  external({
    id: "standard_iso_27018_2025", slug: "iso-iec-27018-2025", name: "ISO/IEC 27018:2025", acronym: "ISO 27018", type: "standard",
    summary: "Guidelines for protecting personally identifiable information in public clouds acting as PII processors.",
    description: "ISO/IEC 27018:2025 (Edition 3) is aligned to ISO/IEC 27002:2022 and includes a new Annex B with extended implementation guidance for protecting PII in public-cloud environments where the provider acts as a PII processor.",
    issuer: "International Organization for Standardization and International Electrotechnical Commission", jurisdictions: ["global"], industries: ["technology-saas", "cross-industry"],
    applicability: "Public-cloud providers and customers evaluating privacy controls; Eidos does not determine legal roles or reproduce licensed text.", version: "2025", publicationDate: "2025-08-26",
    officialUrl: "https://www.iso.org/standard/27018", domains: ["cloud privacy", "personal information", "information security controls"], tags: ["public cloud", "PII", "processor"],
  }),
  external({
    id: "standard_iec_62443_series", slug: "iec-62443-series", name: "IEC 62443 Series", acronym: "IEC 62443", type: "standard",
    summary: "A series of standards addressing cybersecurity for industrial automation and control systems.",
    description: "IEC 62443 addresses roles and life-cycle practices for asset owners, service providers, system integrators, and product suppliers in industrial environments.",
    issuer: "International Electrotechnical Commission", jurisdictions: ["global"], industries: ["critical-infrastructure"],
    applicability: "Industrial automation and control-system stakeholders selecting relevant parts of the series; applicability varies by role and system context.",
    officialUrl: "https://www.iec.ch/cyber-security", domains: ["operational technology", "industrial control systems", "secure development"], tags: ["IACS", "asset owner", "product supplier"],
  }),
  external({
    id: "standard_aicpa_trust_services_criteria", slug: "aicpa-trust-services-criteria", name: "AICPA Trust Services Criteria", acronym: "TSC", type: "criteria",
    summary: "Criteria used in SOC 2 examinations for security, availability, processing integrity, confidentiality, and privacy.",
    description: "The AICPA Trust Services Criteria support system and organization control examinations. SOC 2 is an attestation engagement, not a product certification or universal security framework.",
    issuer: "American Institute of Certified Public Accountants", jurisdictions: ["United States", "global"], industries: ["technology-saas", "professional-services", "cross-industry"],
    applicability: "Service organizations and practitioners conducting or preparing for relevant SOC examinations; scope and criteria are engagement-specific.",
    officialUrl: "https://www.aicpa-cima.com/resources/landing/system-and-organization-controls-soc-suite-of-services", domains: ["assurance", "service organizations", "internal controls"], tags: ["SOC 2", "trust services", "attestation"],
  }),
  external({
    id: "standard_nerc_cip", slug: "nerc-critical-infrastructure-protection-standards", name: "NERC Critical Infrastructure Protection Standards", acronym: "NERC CIP", type: "standard",
    summary: "Mandatory reliability standards addressing cybersecurity of applicable bulk electric system assets in North America.",
    description: "The NERC CIP family covers areas such as asset categorization, security management, personnel, electronic and physical security, systems security, incident reporting, recovery, configuration, and supply-chain risk.",
    issuer: "North American Electric Reliability Corporation", jurisdictions: ["United States", "Canada", "North America"], industries: ["critical-infrastructure"],
    applicability: "Registered entities and assets within approved standard scope and jurisdiction; Eidos does not determine registration, asset impact, or enforceability.",
    officialUrl: "https://www.nerc.com/standards/reliability-standards/cip", domains: ["electric reliability", "operational technology", "critical infrastructure"], tags: ["bulk electric system", "CIP standards", "reliability"],
  }),
  external({
    id: "catalog_nist_sp_800_171_rev_3", slug: "nist-sp-800-171-rev-3", name: "NIST SP 800-171 Revision 3", acronym: "NIST SP 800-171", type: "control_catalog",
    summary: "Security requirements for protecting controlled unclassified information in nonfederal systems and organizations.",
    description: "Revision 3 organizes requirements for protecting CUI when it resides in nonfederal systems and organizations and should be read with applicable contracts, laws, regulations, and assessment procedures.",
    issuer: "U.S. National Institute of Standards and Technology", jurisdictions: ["United States"], industries: ["defense-industrial-base", "government"],
    applicability: "Nonfederal systems processing, storing, or transmitting CUI where a law, regulation, policy, or contract requires the publication; Eidos does not determine CUI or contract scope.", version: "Revision 3", publicationDate: "2024-05-14",
    officialUrl: "https://csrc.nist.gov/pubs/sp/800/171/r3/final", domains: ["CUI protection", "security requirements", "federal contracting"], tags: ["CUI", "nonfederal systems", "requirements"],
  }),
  external({
    id: "catalog_cisa_cpg", slug: "cisa-cross-sector-cybersecurity-performance-goals", name: "Cross-Sector Cybersecurity Performance Goals", acronym: "CPGs", type: "control_catalog",
    summary: "A voluntary, prioritized set of cybersecurity practices intended to reduce risk across critical-infrastructure sectors.",
    description: "CISA's Cross-Sector CPGs 2.0 align to NIST CSF 2.0 functions and the evolving cybersecurity threat landscape. They build upon version 1.0.1 and provide outcome-focused practices designed as a baseline rather than a complete sector-specific program.",
    issuer: "Cybersecurity and Infrastructure Security Agency", jurisdictions: ["United States"], industries: ["critical-infrastructure", "small-business", "cross-industry"],
    applicability: "Critical-infrastructure and other organizations choosing a prioritized baseline; sector-specific goals and actual obligations require separate review.", version: "2.0",
    officialUrl: "https://www.cisa.gov/cross-sector-cybersecurity-performance-goals", domains: ["cyber hygiene", "critical infrastructure", "risk reduction"], tags: ["baseline practices", "outcomes", "CPGs"],
  }),
  external({
    id: "catalog_csa_ccm_4_1", slug: "cloud-controls-matrix-4-1", name: "Cloud Controls Matrix", acronym: "CCM", type: "control_catalog",
    summary: "A cloud-security control framework organized across cloud governance and technical domains.",
    description: "CSA CCM Version 4.1 provides cloud controls and an associated assessment questionnaire for cloud providers, customers, assessors, and other stakeholders.",
    issuer: "Cloud Security Alliance", jurisdictions: ["global"], industries: ["technology-saas", "professional-services", "cross-industry"],
    applicability: "Organizations assessing or designing cloud controls and shared-responsibility arrangements; CCM use does not itself establish certification or compliance.", version: "4.1",
    officialUrl: "https://cloudsecurityalliance.org/research/cloud-controls-matrix", domains: ["cloud security", "third-party assurance", "governance"], tags: ["CAIQ", "cloud controls", "shared responsibility"],
  }),
  external({
    id: "catalog_owasp_asvs_5", slug: "owasp-asvs-5-0", name: "OWASP Application Security Verification Standard", acronym: "ASVS", type: "control_catalog",
    summary: "A basis for testing web-application technical security controls and specifying secure-development requirements.",
    description: "OWASP ASVS 5.0.0 organizes verifiable application-security requirements by topic and assurance level for developers, architects, testers, and procurers.",
    issuer: "OWASP Foundation", jurisdictions: ["global"], industries: ["technology-saas", "cross-industry"],
    applicability: "Teams selecting application-security verification requirements appropriate to an application's risk and assurance needs.", version: "5.0.0",
    officialUrl: "https://owasp.org/www-project-application-security-verification-standard/", domains: ["application security", "verification", "secure development"], tags: ["web applications", "verification levels", "requirements"],
  }),
  external({
    id: "catalog_fedramp_rev_5_baselines", slug: "fedramp-revision-5-baselines", name: "FedRAMP Revision 5 Security Control Baselines", acronym: "FedRAMP Rev. 5", type: "control_catalog",
    summary: "Federal cloud-security baselines and implementation requirements based on NIST SP 800-53 Revision 5.",
    description: "FedRAMP Revision 5 materials tailor federal controls and documentation for cloud-service authorization contexts at defined impact levels. In June 2026 FedRAMP moved its authoritative materials to the Consolidated Rules for 2026; the Revision 5 documentation is retained as a legacy reference for active engagements.",
    issuer: "Federal Risk and Authorization Management Program", jurisdictions: ["United States"], industries: ["government", "technology-saas"],
    applicability: "Cloud services pursuing or maintaining applicable FedRAMP authorization and federal agencies using the program; Eidos does not determine authorization scope.", version: "Revision 5 (legacy; Consolidated Rules for 2026 in force)",
    officialUrl: "https://www.fedramp.gov/rev5/", domains: ["cloud security", "federal authorization", "security controls"], tags: ["baselines", "cloud service offering", "authorization", "legacy", "Consolidated Rules 2026"],
  }),
  external({
    id: "catalog_cis_benchmarks", slug: "cis-benchmarks", name: "CIS Benchmarks", acronym: "CIS Benchmarks", type: "control_catalog",
    summary: "Community-developed secure-configuration recommendations for operating systems, cloud services, applications, and network devices.",
    description: "CIS Benchmarks provide technology-specific configuration guidance and profiles. Eidos links to the publisher rather than reproducing benchmark content.",
    issuer: "Center for Internet Security", jurisdictions: ["global"], industries: ["cross-industry", "technology-saas", "small-business"],
    applicability: "Organizations selecting secure-configuration guidance for technologies they use; benchmark versions and profiles must match the deployed product and risk context.",
    officialUrl: "https://www.cisecurity.org/cis-benchmarks", domains: ["secure configuration", "hardening", "technology baselines"], tags: ["configuration guides", "profiles", "benchmarks"],
  }),
] as const;
