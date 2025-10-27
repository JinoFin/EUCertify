## EUCertify Wizard v2 (October 2025 Update)
✅ Implemented new question flow with 5-step user-friendly design  
✅ Added icons, tooltips, and grouped logic  
✅ Fixed navigation & validation bugs  
✅ Added unit tests for flow consistency  
✅ Ready for integration with rulesEngine  

### To-Do Next
- [ ] Add multi-language (EN/DE/FR) question text support
- [ ] Connect to compliance output generator page
- [ ] Implement “Save progress” feature
- [ ] Style Step headers with category icons

### Fixes (Oct 2025)
✅ TypeScript LegislationType mismatch resolved  
✅ All rule objects use literal assertions (`as const`)  
✅ CI typecheck now passes  

## Answer Examples
All questionnaire options now include short **examples** to guide non-experts (shown via an inline “Examples” toggle).
- Improves accuracy of product classification
- Reduces backtracking and support questions

### Authoring rules
- Add examples with `examples: [...]` and optional `exampleTitle`.
- Keep examples short (≤ 8 words) and concrete (“Bluetooth speaker”, not “portable audio apparatus”).

## Results Page v2
- Summarizes product type/role/markets and detected features.
- Groups required documents with explanations and indicates whether they’re exportable in-app, require upload, or must be obtained externally (lab/Notified Body/authority).
- Country obligations are grouped per selected market (DE/FR/ES/IT included).
- Confidence %, “why it applies”, and “what to do” shown per rule.
- One-click PDF export of the report.

### Authoring Notes
- Add new documents in `src/data/documentCatalog.ts`.
- Add/extend country obligations in `src/data/countryObligations.ts`.
- Explainers live in `eucertify.v1.json` → `explainers` block.

## Document Generation
EUCertify can now generate and export:
- EU Declaration of Conformity (PDF/DOCX)
- Risk Assessment register (PDF/DOCX)
- Technical File checklist (PDF)
- Labels & Markings checklist (PDF)
- EPR Registration Info sheets (PDF)
- User Manual starter (PDF/DOCX)

**Statuses**
- 🟢 Exportable in EUCertify (Generate)
- 🟡 Upload your evidence (we supply a checklist/template)
- 🔴 External – obtain from lab/Notified Body/authority

**How it works**
- Documents auto-fill from your wizard answers and the Results report.
- You can edit fields before exporting.
- Drafts are stored locally and can be re-exported.

## One-Click Compliance Pack
After completing the wizard, EUCertify can automatically generate editable, prefilled compliance documents:

| Document | Auto-filled fields |
|-----------|-------------------|
| DoC | Manufacturer, product, model, applicable directives, EN standards |
| Risk Register | Product, placeholder hazard table |
| Tech File Checklist | Default evidence list |
| Labels Checklist | CE/WEEE/Battery/Triman based on results |
| EPR Info Sheet | Country registrations |
| Manual Starter | Product name/model & recycling note |

Button: **“Generate My Compliance Pack”** on the results page creates these drafts instantly.

## Selectable Legislation & EN Standards
- EUCertify now stores a library of **Applicable EU Legislation** and **EN Standards** with short explanations and groups.
- In the **DoC editor**, click **“Choose legislation & standards”** to pick which items to include.
- Selections are saved per document and used in PDF/DOCX export.
- Defaults are suggested from your results (you can override them).
