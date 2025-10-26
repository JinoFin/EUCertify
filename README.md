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
