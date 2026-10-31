# Third-Party Libraries, Assets and Tools

Versions in the table are the declarations in `package.json`; `package-lock.json` records the resolved dependency tree. Verify current licences and notices from the package distributions before publishing a release.

| Library / tool | Declared version | Purpose | Runtime role |
|---|---:|---|---|
| Next.js | 14.2.15 | App framework, routing and API handlers | Runtime/build |
| React | ^18.3.1 | UI rendering | Runtime |
| React DOM | ^18.3.1 | Browser rendering | Runtime |
| Tailwind CSS | ^3.4.1 | Utility styling | Build |
| Framer Motion | ^11.11.9 | UI animation | Runtime |
| Lucide React | ^0.453.0 | Icon components | Runtime |
| clsx | ^2.1.1 | Conditional class names | Runtime |
| tailwind-merge | ^2.5.4 | Tailwind class conflict merging | Runtime |
| TypeScript | ^5 | Type checking and compilation | Development |
| Node.js | 18.17+ recommended | JavaScript runtime | Development/production |
| Python standard library | 3.8+ intended | `validator.py` schedule validation | Validation only |

## AI providers

| Provider | Model | Integration | Key required |
|---|---|---|---|
| Groq | `GROQ_MODEL` (default `llama3-8b-8192`) | Called via Groq REST API from `app/api/ai/parse/route.ts` for draft natural-language booking intent extraction. Output is type-checked, bounded and allow-listed; it is not a booking validation or approval. | `GROQ_API_KEY` |

The application operates in full rule-based mode if the Groq key is absent or Groq is unreachable.

## Fonts and images

- Geist font files are included under `app/fonts/`.
- Campus hero images are included under `public/images/`.
- Confirm that any separately sourced asset has the required licence/permission and retain its attribution where required.

## Licence review

This document is an inventory, not a legal determination. Before distribution, review the licence files and notices for every direct and transitive package, plus the rights for bundled fonts and images. Preserve required copyright and licence notices.
