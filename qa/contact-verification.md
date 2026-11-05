# Contact and commercial image verification — 2026-11-04

- Replaced the generic interior-design mockup with a generated commercial store concept named Ponto Tech. The concept disclosure remains visible. The optimized WebP is used in the card, solution dialog and contact illustration.
- Restored the original Formspree form ID meaoaayd, keeping the recipient configured in the owner's existing provider account. The form is visible, requires a name, reply email and description, and includes company and project interest.
- Unit tests cover endpoint and submitted fields, failure without data loss, duplicate submission prevention and resetting only after acceptance. All 21 project tests pass. Production build succeeds.
- Desktop native validation focused the missing name field. The 390px iframe preview showed a single-column form. No horizontal overflow was measured in the main preview.
- Bundled src/portfolio.html as a raw import to prevent a new app bundle from fetching an obsolete cached public/portfolio.html. Page and submission handler now update together.
- After explicit owner authorization, submitted exactly one fictional message through https://logicacode.com.br/ with name “Teste do formulário — Logica Code” and illustrative reply address teste@example.com. The service accepted the submission and the UI showed success. Inbox receipt has not been independently confirmed.
- Evidence outside the repository: C:/Logica Code/auditoria/portfolio-contato-envio-confirmado.png.
