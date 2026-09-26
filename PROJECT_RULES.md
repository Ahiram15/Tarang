# PROJECT_RULES.md — TARANG Engineering Standards & Architecture Rules

> **Single Source of Truth** for TARANG engineering standards, architecture rules, and development protocols.

---

## 🏛️ Repository Architecture

The repository enforces a strict, clean separation between frontend web client and backend microservices:

```
Oil_spill(sos)/
├── backend/                  # Python FastAPI microservice, ML models & analytics engine
│   ├── api.py               # REST API endpoints & route handlers
│   ├── cdse_client.py       # Copernicus CDSE API acquisition client
│   ├── preprocess.py        # Radiometric calibration & tensor normalization
│   ├── unet_oilspill.h5     # Pretrained dual-pol U-Net segmentation model
│   ├── characterization/    # Geometry, movement drift, particle hindcast & investigation engine
│   ├── modules/             # Benchmark test suites (e.g. benchmark_emerald.py)
│   ├── data/                # Ground-truth SAR/optical benchmark datasets
│   └── requirements.txt     # Python backend dependencies
│
├── frontend/                 # React + Vite + TypeScript web application
│   ├── src/
│   │   ├── components/      # 5 Core Mission Suites (Landing, Globe, Vision, Drift, Forensics)
│   │   ├── assets/          # Satellite video streams & media feeds
│   │   ├── utils/           # Spatial coordinate conversions & reverse lookup
│   │   ├── types.ts         # TypeScript interfaces & API contracts
│   │   └── App.tsx          # Main application router
│   ├── package.json         # Frontend dependencies & npm scripts
│   ├── tsconfig.json        # Strict TypeScript configuration
│   └── vite.config.ts       # Vite configuration
│
├── tests/                    # Automated pytest test suites
│   ├── conftest.py          # Automatic sys.path configuration for backend
│   ├── test_characterization.py
│   ├── test_investigation.py
│   └── test_benchmark_emerald.py
│
├── api.py                    # Root backward-compatibility proxy shim (uvicorn api:app)
├── requirements.txt          # Root requirements reference
├── README.md                 # Project documentation & setup guide
└── .gitignore                # Git ignore rules
```

---

## ⚡ Core Engineering Protocol

**SPEC → PLAN → EXECUTE → VERIFY → COMMIT**

1. **SPEC**: Clearly understand requirements, boundary conditions, and design constraints before making code modifications.
2. **PLAN**: Break changes down into verifiable steps with clear dependency order.
3. **EXECUTE**: Implement changes cleanly adhering strictly to code style and architecture patterns.
4. **VERIFY**: Prove completion with empirical evidence:
   - Frontend: `npx tsc --noEmit` must pass with 0 errors.
   - Backend: `python -m pytest tests/` must pass all test suites.
5. **COMMIT**: Format commit messages as `type(scope): description` and push verified changes.

---

## 🎨 Frontend Design & Development Rules

1. **Strict TypeScript**: Every component, prop, and state variable must be properly typed in `frontend/src/types.ts`. Avoid `any` whenever possible.
2. **Vanilla CSS & Design Tokens**: Use curated, rich modern palettes (dark mode, glassmorphism, glowing telemetry accents, and smooth transitions). Avoid adding Tailwind CSS unless explicitly requested by the user.
3. **Dedicated Satellite Imagery**: All geospatial map views (Characterization Dashboard, Maritime Investigation Suite) must use high-resolution **Esri World Imagery** satellite tiles (`maxNativeZoom={13}`, `maxZoom={20}`) to ensure zero gray watermark tiles.
4. **Clean Layer Management**: Organize dense GIS and forensic map layers into tabbed drawer pages (e.g. *Suspect Vessels* vs. *Infrastructure & Coastal Assets*) with heavy visual layers (streamlines, simulated slicks, hindcast advection particle lines) defaulting to off/unchecked so maps remain high-contrast and uncluttered.
5. **No Placeholders**: Never render broken image links, placeholder boxes, or mock error text.

---

## 🐍 Backend Architecture Rules

1. **Self-Contained Backend**: All backend modules, models, algorithms, and dependencies reside within `backend/`.
2. **Path Robustness**: Never hardcode working-directory-relative paths. Always resolve files using `os.path.dirname(os.path.abspath(__file__))` or `_BACKEND_DIR` so code runs identically whether invoked from repo root or inside `backend/`.
3. **Root Proxy Shim**: Maintain the lightweight `api.py` root proxy shim so standard development commands (`uvicorn api:app --reload`) remain fully functional.
4. **Pydantic Validation**: All API request and response bodies must be validated with Pydantic models.
5. **Graceful Degraded Modes**: External API calls (CDSE, GFW, MetOcean) must have robust fallback handlers that serve realistic benchmark data if remote services are unavailable.

---

## 🧪 Testing & Verification Requirements

Every code change requires verification evidence:

| Change Scope | Required Verification |
| :--- | :--- |
| **Frontend components/types** | `cd frontend && npx tsc --noEmit` (0 errors) |
| **Backend routes & algorithms** | `python -m pytest tests/ -v` (All 25 tests pass) |
| **API endpoints** | Validated via HTTP response / curl / Swagger test |
| **Documentation & configs** | Markdown links and directory structures cross-checked |

---

## 💻 Commit Conventions

Commit format:
```
type(scope): description

- Detailed bullet point 1
- Detailed bullet point 2
```

Allowed types:
- `feat`: New feature or user capability
- `fix`: Bug fix
- `refactor`: Code reorganization without functional regression
- `docs`: Documentation updates
- `test`: Adding or updating test suites
- `chore`: Dependency updates, file cleanup, or repo maintenance

---

## 🐚 Shell Discipline (PowerShell / Windows)

- Run one command per invocation. Avoid chaining with `&&` or `||` in PowerShell.
- Provide proper quotes around Windows paths containing parentheses (e.g. `"d:\Oil_spill(sos)\frontend"`).
