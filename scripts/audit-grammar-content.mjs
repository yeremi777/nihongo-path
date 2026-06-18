import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  ROOT,
  auditCommonLessonShell,
  auditContohKalimat,
  auditFuriganaQuality,
  auditLessonCollection,
  auditLessonMetadata,
  auditLevelExampleLength,
  auditNoMarkdownFurigana,
  auditPlaceholderLanguage,
  auditReferenceSection,
  auditMiniPractice,
  createIssueCollector,
  collectLessonFiles,
  printAuditReport,
  section,
} from "./lesson-audit-shared.mjs";

const GRAMMAR_DIRS = [
  path.join(ROOT, "content/learn/n5/grammar"),
  path.join(ROOT, "content/learn/n3/grammar"),
  path.join(ROOT, "content/learn/n4/grammar"),
];

const REQUIRED_SECTIONS = [
  "Tujuan",
  "Pola Hari Ini",
  "Peta Pola",
  "Cara Membentuk Pola",
  "Bangun Kalimat Bertahap",
  "Catatan Pemakaian",
  "Pola yang Sering Muncul",
  "Contoh Kalimat",
  "Hal yang Mudah Tertukar",
  "Kesalahan Umum",
  "Mini Practice",
  "Referensi",
];

const PLACEHOLDER_SECTIONS = [
  "Pola Hari Ini",
  "Peta Pola",
  "Cara Membentuk Pola",
  "Bangun Kalimat Bertahap",
  "Pola yang Sering Muncul",
  "Hal yang Mudah Tertukar",
];

const UNPARENTHESIZED_PLACEHOLDER_RE =
  /(?<![（(])\b(?:N|V|Adj|いAdj|なAdj|Person|Place|Time|Clause)\b(?![）)])/;

const collectGrammarLessonFiles = () =>
  GRAMMAR_DIRS.flatMap(collectLessonFiles);

const auditGrammarPlaceholders = (text, push) => {
  for (const heading of PLACEHOLDER_SECTIONS) {
    const block = section(text, heading);
    if (!block) continue;

    const tableLines = block
      .split("\n")
      .filter((line) => line.trim().startsWith("|"));

    for (const line of tableLines) {
      const lineWithoutParentheticalGroups = line.replace(
        /（[^）]*）|\([^)]*\)/g,
        "",
      );
      if (UNPARENTHESIZED_PLACEHOLDER_RE.test(lineWithoutParentheticalGroups)) {
        push(
          `## ${heading} table has an unparenthesized grammar placeholder: ${line.trim()}`,
        );
      }
    }
  }
};

const auditGrammarFile = (file, text) => {
  const { errors, warnings, error, warn } = createIssueCollector(file);
  const lessonMeta = auditLessonMetadata(file, text, error, warn, "grammar");

  auditCommonLessonShell(text, error, {
    requiredSections: REQUIRED_SECTIONS,
    wordStripSection: "Peta Pola",
  });

  const polaHariIni = section(text, "Pola Hari Ini");
  if (!/^\|[^\n]+\|\s*$/m.test(polaHariIni)) {
    error("## Pola Hari Ini must include a pattern summary table");
  }

  const bangunKalimat = section(text, "Bangun Kalimat Bertahap");
  if (!/^\|[^\n]+\|\s*$/m.test(bangunKalimat)) {
    error("## Bangun Kalimat Bertahap must include a step-build table");
  }

  auditContohKalimat(section(text, "Contoh Kalimat"), error);
  auditNoMarkdownFurigana(text, error);
  auditFuriganaQuality(text, error);
  auditMiniPractice(text, error);
  auditGrammarPlaceholders(text, error);
  auditPlaceholderLanguage(text, error);
  auditReferenceSection(text, lessonMeta, error, "grammar");
  auditLevelExampleLength(text, lessonMeta, warn);

  if (lessonMeta?.level === "N3") {
    const nuanceSignals = [
      "ニュアンス",
      "nuance",
      "Catatan Pemakaian",
      "Hal yang Mudah Tertukar",
      "Kesalahan Umum",
    ];
    if (!nuanceSignals.some((signal) => text.includes(signal))) {
      warn("N3 grammar should include nuance, contrast, or common-mistake guidance");
    }
  }

  return { errors, warnings };
};

export function runGrammarAudit() {
  const lessonFiles = collectGrammarLessonFiles();
  const issues = [];
  const warnings = [];

  auditLessonCollection(
    lessonFiles,
    (message) => issues.push(message),
    (message) => warnings.push(message),
    "grammar",
  );

  for (const file of lessonFiles) {
    const result = auditGrammarFile(file, fs.readFileSync(file, "utf8"));
    issues.push(...result.errors);
    warnings.push(...result.warnings);
  }

  return { lessonFiles, issues, warnings };
}

const isMain =
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMain) {
  printAuditReport({
    name: "Grammar",
    ...runGrammarAudit(),
  });
}
