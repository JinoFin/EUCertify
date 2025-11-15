export const lawMapping = {
  RED: [
    'EN 300 328: Funkanlagen – Datenübertragungssysteme',
    'EN 301 489-1: EMV-Anforderungen für Funkgeräte',
    'EN 62368-1: Audio/Video & IKT Sicherheit'
  ],
  EMC: [
    'EN 301 489-17: Funkanlagen – Breitbanddatenübertragung',
    'EN 61000-6-3: EMV – Störaussendungen',
    'EN 61000-6-1: EMV – Störfestigkeit'
  ],
  LVD: [
    'EN 62368-1: Audio/Video Sicherheit',
    'EN 60335-1: Sicherheit elektrischer Geräte für den Hausgebrauch'
  ],
  RoHS: [
    'EN IEC 63000: Technische Dokumentation zur Bewertung elektrischer Geräte bezüglich gefährlicher Stoffe'
  ],
  GPSR: [
    'EN ISO 12100: Risikobeurteilung',
    'EN ISO 10377: Produktsicherheit für Verbraucher'
  ],
  MDR: [
    'EN ISO 13485: Qualitätsmanagement medizinische Geräte',
    'EN 60601-1: Sicherheit medizinischer elektrischer Geräte'
  ]
} as const

export type LawCode = keyof typeof lawMapping
