import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(process.cwd());
const optionBRoot = path.join(repoRoot, "docs", "option-b");

function fail(message) {
  console.error(`❌ [option-b-docs] ${message}`);
  process.exitCode = 1;
}

function readText(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function listAllFiles(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...listAllFiles(full));
    else out.push(full);
  }
  return out;
}

function rel(p) {
  return path.relative(repoRoot, p).replaceAll("\\", "/");
}

function assertExists(p, context) {
  if (!fs.existsSync(p)) fail(`${context}: missing file ${rel(p)}`);
}

// -----------------------------------------------------------------------------
// 0) Sanity: required roots
// -----------------------------------------------------------------------------
assertExists(optionBRoot, "Option B root");
assertExists(path.join(optionBRoot, "00_ROCKET_INDEX.md"), "Rocket index");
assertExists(path.join(optionBRoot, "01_architecture", "00_glossary_and_naming.md"), "Glossary");
assertExists(path.join(optionBRoot, "99_DOC_GOVERNANCE.md"), "Governance doc");

// -----------------------------------------------------------------------------
// 1) Usecase docs: required sections + mermaid + proof anchors
// -----------------------------------------------------------------------------
const usecaseDir = path.join(optionBRoot, "07_usecases");
assertExists(usecaseDir, "Usecase dir");

const usecaseFiles = fs
  .readdirSync(usecaseDir)
  .filter((f) => f.endsWith(".md") && f !== "00_usecase_index.md")
  .map((f) => path.join(usecaseDir, f));

if (usecaseFiles.length === 0) {
  fail("No usecase docs found in docs/option-b/07_usecases/");
}

for (const f of usecaseFiles) {
  const txt = readText(f);
  const name = rel(f);

  const requiredHeadings = [
    "## Diagram (canonical)",
    "## Invariants",
    "## Proof anchors",
  ];
  for (const h of requiredHeadings) {
    if (!txt.includes(h)) fail(`${name}: missing required heading "${h}"`);
  }

  const hasMermaid = /```mermaid\s*\n[\s\S]*?\n```/m.test(txt);
  if (!hasMermaid) fail(`${name}: missing mermaid code block`);
}

// -----------------------------------------------------------------------------
// 2) Proof anchors: ensure referenced repo paths exist
//     We interpret any token that looks like "frontend/..." or "backendv2/..." or "docs/..."
// -----------------------------------------------------------------------------
const mdFiles = listAllFiles(optionBRoot).filter((f) => f.endsWith(".md"));

const pathLikeRegex =
  /(^|[\s`(])((frontend|backendv2|docs)\/[A-Za-z0-9._/-]+\.(ts|tsx|py|md|mjs|js|sh))([)\s`.,:]|$)/gm;

for (const f of mdFiles) {
  const txt = readText(f);
  const fileRel = rel(f);

  for (const match of txt.matchAll(pathLikeRegex)) {
    const candidate = match[2];
    const abs = path.join(repoRoot, candidate);
    if (!fs.existsSync(abs)) {
      fail(`${fileRel}: proof anchor path does not exist: ${candidate}`);
    }
  }
}

// -----------------------------------------------------------------------------
// 3) Mars mission docs: safety-critical requirements
// -----------------------------------------------------------------------------
const marsMissionDir = path.join(optionBRoot, "08_mars_mission");
if (fs.existsSync(marsMissionDir)) {
  const marsFiles = [
    "00_mission_overview.md",
    "01_environmental_constraints.md",
    "02_operational_procedures.md",
    "03_safety_reliability.md",
    "04_human_factors.md",
    "05_verification_validation.md",
    "06_mars_acceptance_criteria.md",
    "07_mars_readiness_roadmap.md",
    "08_software_development_plan.md",
    "09_configuration_management_plan.md",
    "10_risk_management_plan.md",
    "11_nasa_approval_readiness.md"
  ];

  for (const marsFile of marsFiles) {
    const marsPath = path.join(marsMissionDir, marsFile);
    assertExists(marsPath, `Mars mission doc ${marsFile}`);

    const txt = readText(marsPath);
    const fileRel = rel(marsPath);

    // Check for formal verification references
    if (!txt.includes("formal verification") && !txt.includes("Formal Verification")) {
      fail(`${fileRel}: Mars mission doc missing formal verification requirements`);
    }

    // Check for safety analysis references (except overview)
    if (marsFile !== "00_mission_overview.md" &&
        !txt.includes("FMEA") && !txt.includes("FTA") &&
        !txt.includes("safety analysis") && !txt.includes("Safety Analysis")) {
      fail(`${fileRel}: Mars mission doc missing safety analysis requirements`);
    }

    // Check for radiation hardening (except human factors)
    if (marsFile !== "04_human_factors.md" &&
        !txt.includes("radiation") && !txt.includes("Radiation")) {
      fail(`${fileRel}: Mars mission doc missing radiation considerations`);
    }
  }
}

// -----------------------------------------------------------------------------
// 4) Disallow prefixed IDs in Option B docs (except in explicitly allowed contexts)
// -----------------------------------------------------------------------------
// Allowed contexts:
// - glossary file (it explicitly mentions doc_/ws_/fld_)
// - canonical_identity file (explains legacy)
const allowedFiles = new Set([
  rel(path.join(optionBRoot, "01_architecture", "00_glossary_and_naming.md")),
  rel(path.join(optionBRoot, "01_architecture", "02_canonical_identity.md")),
  rel(path.join(optionBRoot, "05_migration", "01_existing_data_failure_modes.md")),
  rel(path.join(optionBRoot, "05_migration", "02_remediation_flows.md")),
  rel(path.join(optionBRoot, "05_migration", "04_frontend_migrations.md")),
]);

const forbiddenPrefixRegex = /\b(doc_|ws_|fld_)[0-9a-fA-F-]{8,}\b/g;

for (const f of mdFiles) {
  const fileRel = rel(f);
  if (allowedFiles.has(fileRel)) continue;
  const txt = readText(f);
  const hits = txt.match(forbiddenPrefixRegex);
  if (hits && hits.length > 0) {
    fail(`${fileRel}: contains prefixed IDs (forbidden in Option B docs): ${hits.slice(0, 3).join(", ")}${hits.length > 3 ? "..." : ""}`);
  }
}

// -----------------------------------------------------------------------------
// 5) Result
// -----------------------------------------------------------------------------
if (!process.exitCode) {
  const marsCount = fs.existsSync(marsMissionDir) ?
    fs.readdirSync(marsMissionDir).filter(f => f.endsWith('.md')).length : 0;
  console.log(`✅ [option-b-docs] Validation passed (${usecaseFiles.length} usecase docs, ${mdFiles.length} md files, ${marsCount} Mars mission docs).`);
}


