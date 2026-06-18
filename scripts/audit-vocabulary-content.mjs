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
  collectLessonFiles,
  createIssueCollector,
  printAuditReport,
  section,
} from "./lesson-audit-shared.mjs";

const VOCABULARY_DIRS = [
  path.join(ROOT, "content/learn/n5/vocabulary"),
  path.join(ROOT, "content/learn/n3/vocabulary"),
  path.join(ROOT, "content/learn/n4/vocabulary"),
];

const REQUIRED_SECTIONS = [
  "Tujuan",
  "Daftar Kata",
  "Peta Kata",
  "Catatan Pemakaian",
  "Pola yang Sering Muncul",
  "Contoh Kalimat",
  "Hal yang Mudah Tertukar",
  "Kesalahan Umum",
  "Mini Practice",
  "Referensi",
];

const WORD_LIST_TABLE_HEADER = "| Japanese | Reading | Arti & Catatan |";

const collectVocabularyLessonFiles = () =>
  VOCABULARY_DIRS.flatMap(collectLessonFiles);

const auditVocabularyFile = (file, text) => {
  const { errors, warnings, error, warn } = createIssueCollector(file);
  const lessonMeta = auditLessonMetadata(file, text, error, warn, "vocabulary");

  auditCommonLessonShell(text, error, {
    requiredSections: REQUIRED_SECTIONS,
    wordStripSection: "Peta Kata",
  });

  const daftarKata = section(text, "Daftar Kata");
  if (!daftarKata.includes(WORD_LIST_TABLE_HEADER)) {
    error(
      "## Daftar Kata must use word tables with Japanese, Reading, and Arti & Catatan columns",
    );
  }

  auditContohKalimat(section(text, "Contoh Kalimat"), error);
  auditNoMarkdownFurigana(text, error);
  auditFuriganaQuality(text, error);
  auditMiniPractice(text, error);
  auditPlaceholderLanguage(text, error);
  auditReferenceSection(text, lessonMeta, error, "vocabulary");
  auditLevelExampleLength(text, lessonMeta, warn);

  const wordRows = daftarKata
    .split("\n")
    .filter((line) => line.trim().startsWith("|") && !line.includes("---"));

  if (lessonMeta?.level === "N5" && wordRows.length > 32) {
    warn(`N5 vocabulary lesson has ${wordRows.length - 1} table row(s); review whether the beginner load is too dense`);
  }

  if (lessonMeta?.level === "N3") {
    const usageSignals = ["kolokasi", "frasa", "konteks", "nuansa", "sering muncul"];
    if (!usageSignals.some((signal) => text.toLowerCase().includes(signal))) {
      warn("N3 vocabulary should usually include collocation, context, or nuance notes");
    }
  }

  return { errors, warnings };
};

export function runVocabularyAudit() {
  const lessonFiles = collectVocabularyLessonFiles();
  const issues = [];
  const warnings = [];

  auditLessonCollection(
    lessonFiles,
    (message) => issues.push(message),
    (message) => warnings.push(message),
    "vocabulary",
  );

  for (const file of lessonFiles) {
    const result = auditVocabularyFile(file, fs.readFileSync(file, "utf8"));
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
    name: "Vocabulary",
    ...runVocabularyAudit(),
  });
}
