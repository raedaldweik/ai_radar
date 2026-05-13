// The 6 GDRFA operational lenses. Every scored item gets a 0-100 score on each.
// These should stay stable — changing them invalidates all cached scores.

export const LENSES = {
  identity_biometrics: {
    label: 'Identity & Biometrics',
    description:
      'Facial recognition, e-gates, document verification, liveness detection, biometric authentication, smart cards, and identity assurance technologies.',
  },
  border_control: {
    label: 'Border Control & Immigration',
    description:
      'Passenger flows, smart corridors, risk scoring, customs technology, immigration processing, and inbound/outbound traveller systems.',
  },
  customer_happiness: {
    label: 'Customer Happiness',
    description:
      'Service quality, multilingual customer support, accessibility, wait-time reduction, and digital UX improvements in government services.',
  },
  residency_visa: {
    label: 'Residency & Visa',
    description:
      'Visa and residency application processing, document classification, eligibility scoring, automated case management, and renewals.',
  },
  ai_sovereignty: {
    label: 'AI Sovereignty (UAE)',
    description:
      'UAE-built AI ecosystem (Falcon, MBZUAI, G42, TII), Arabic-first models, on-prem and sovereign deployment, and national AI strategy alignment.',
  },
  cybersecurity: {
    label: 'Cybersecurity & Trust',
    description:
      'Fraud detection, deepfakes, identity theft, data protection, AI security, adversarial robustness, and trust infrastructure.',
  },
} as const;

export type LensKey = keyof typeof LENSES;

export const SUGGESTED_ACTIONS = ['pilot_candidate', 'monitor', 'policy_watch', 'ignore'] as const;
export type SuggestedAction = (typeof SUGGESTED_ACTIONS)[number];

export interface ItemScore {
  id: string;
  gdrfaRelevance: number;
  lenses: Record<LensKey, number>;
  suggestedAction: SuggestedAction;
  whyItMatters: string;
}