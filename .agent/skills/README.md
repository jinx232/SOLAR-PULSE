# Reusable AI Development Skills

This directory contains curated AI pair-programming and design skills installed into the workspace for Antigravity and compatible agentic coding tools.

---

## Installed Skills Catalog

| Skill Name | Domain / Purpose | Source Repository | License | Invocation Trigger |
| :--- | :--- | :--- | :--- | :--- |
| [`saas`](./saas/SKILL.md) | B2B SaaS visual design system, cards, high-contrast layouts | [Awesome Design Skills](https://github.com/jdsadminllc/awesome-design-skills) | MIT | Mention "SaaS design", "build a SaaS dashboard", or invoke `saas` |
| [`clean`](./clean/SKILL.md) | Minimalist grid-based visual design with zero fluff | [Awesome Design Skills](https://github.com/jdsadminllc/awesome-design-skills) | MIT | Mention "clean design", "minimal layout", or invoke `clean` |
| [`kill-ai-slop`](./kill-ai-slop/SKILL.md) | Detect and remove AI-generated visual & copywriting cliches | [Kill AI Slop](https://github.com/yetone/kill-ai-slop) | Apache 2.0 | Mention "kill AI slop", "de-slop", "remove the AI look", or invoke `kill-ai-slop` |
| [`system-designer`](./system-designer/SKILL.md) | General software architecture, reliability, data modeling | [Skills for Antigravity](https://github.com/omer-metin/skills-for-antigravity) | Apache 2.0 | Mention "system design", "software architecture", "scalability", or invoke `system-designer` |
| [`prioritization-advisor`](./prioritization-advisor/SKILL.md) | Feature prioritization frameworks (RICE, Kano, Value/Effort) | [Product Manager Skills](https://github.com/deanpeters/Product-Manager-Skills) | CC BY-NC-SA 4.0 | Mention "prioritize features", "framework recommendation", or invoke `prioritization-advisor` |
| [`jobs-to-be-done`](./jobs-to-be-done/SKILL.md) | Customer needs discovery (functional, social, emotional jobs) | [Product Manager Skills](https://github.com/deanpeters/Product-Manager-Skills) | CC BY-NC-SA 4.0 | Mention "jobs to be done", "JTBD", "customer pains and gains", or invoke `jobs-to-be-done` |
| [`customer-journey-map`](./customer-journey-map/SKILL.md) | End-to-end journey mapping, friction analysis, usability | [Product Manager Skills](https://github.com/deanpeters/Product-Manager-Skills) | CC BY-NC-SA 4.0 | Mention "customer journey", "journey map", "user flow friction", or invoke `customer-journey-map` |
| [`lean-ux-canvas`](./lean-ux-canvas/SKILL.md) | Business problem framing, assumption surfacing, UX hypotheses | [Product Manager Skills](https://github.com/deanpeters/Product-Manager-Skills) | CC BY-NC-SA 4.0 | Mention "Lean UX", "test hypotheses", "review app usability", or invoke `lean-ux-canvas` |

---

## Detailed Skill Profiles & Limitations

### 1. Visual Design Skills: `saas` & `clean`
* **Source**: [jdsadminllc/awesome-design-skills](https://github.com/jdsadminllc/awesome-design-skills)
* **What is included**: `SKILL.md` (agent instructions for colors, typography, components, accessibility, writing tone) and companion `DESIGN.md` (human design brief and references).
* **How to invoke**:
  - Ask the agent: *"Apply the saas design skill to restyle this dashboard card."*
  - Or: *"Use the clean design skill for our reporting views."*
* **Limitations**: Focuses strictly on visual style, color palettes, and component aesthetics. It does not dictate application business logic or backend API structure.

### 2. Code Quality & Aesthetic Sanitation: `kill-ai-slop`
* **Source**: [yetone/kill-ai-slop](https://github.com/yetone/kill-ai-slop)
* **What is included**: Full skill folder containing `SKILL.md`, `README.md`, `references/` (`detection.md`, `fixes.md`, `taxonomy.md`), and bundled dependency-free inspection scripts (`scripts/scan.mjs`, `scripts/rules.ru.mjs`).
* **How to invoke**:
  - Ask the agent: *"Scan this app for AI slop and remove generic gradient headlines and pill badges."*
  - Run the scanner: `node .agent/skills/kill-ai-slop/scripts/scan.mjs .`
* **Limitations**: The scanner identifies code patterns (cliches, tells, unused markup); it never auto-edits files without explicit user review.

### 3. Architecture & Reliability: `system-designer`
* **Source**: [omer-metin/skills-for-antigravity](https://github.com/omer-metin/skills-for-antigravity)
* **What is included**: `SKILL.md` along with reference guides in `references/` (`patterns.md`, `sharp_edges.md`, `validations.md`).
* **How to invoke**:
  - Ask the agent: *"Act as system-designer to review our telemetry state synchronization and offline caching architecture."*
* **Limitations**: Focuses on system architecture, data models, failure domain isolation, and production trade-offs. It explicitly excludes micro-benchmarking performance profiling and team management workflows.

### 4. Product Management Suite: `prioritization-advisor`, `jobs-to-be-done`, `customer-journey-map`, `lean-ux-canvas`
* **Source**: [deanpeters/Product-Manager-Skills](https://github.com/deanpeters/Product-Manager-Skills)
* **What is included**: `SKILL.md` files accompanied by `template.md` and `examples/` for structured output generation.
* **How to invoke**:
  - Feature Prioritization: *"Use prioritization-advisor to help rank solar calculation accuracy vs user telemetry features."*
  - User Needs Assessment: *"Run jobs-to-be-done for solar installers trying to size inverters in the field."*
  - Usability & Flow Review: *"Build a customer-journey-map for a homeowner sizing an energy storage system on mobile."*
  - Problem & Hypothesis Framing: *"Use lean-ux-canvas to review drop-off between sizing and checkout."*
* **Limitations**: Designed for qualitative analysis, product alignment, and strategic prioritization; does not execute code changes directly.

---

## Antigravity Discovery

Skills placed in `.agent/skills/<skill-name>/SKILL.md` are automatically discovered by Antigravity during progressive disclosure. The agent loads the name and description into its context on startup, and retrieves the full `SKILL.md` and reference files on demand when activated.
