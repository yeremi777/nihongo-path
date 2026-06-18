import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  ROOT,
  auditCommonLessonShell,
  auditContohKalimat,
  auditFuriganaQuality,
  auditNoMarkdownFurigana,
  auditMiniPractice,
  collectLessonFiles,
  rel,
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
  const issues = [];
  const push = (message) => issues.push(`${rel(file)}: ${message}`);

  auditCommonLessonShell(text, push, {
    requiredSections: REQUIRED_SECTIONS,
    wordStripSection: "Peta Kata",
  });

  const daftarKata = section(text, "Daftar Kata");
  if (!daftarKata.includes(WORD_LIST_TABLE_HEADER)) {
    push(
      "## Daftar Kata must use word tables with Japanese, Reading, and Arti & Catatan columns",
    );
  }

  auditContohKalimat(section(text, "Contoh Kalimat"), push);
  auditNoMarkdownFurigana(text, push);
  auditFuriganaQuality(text, push);
  auditMiniPractice(text, push);

  return issues;
};

export function runVocabularyAudit() {
  const lessonFiles = collectVocabularyLessonFiles();
  const issues = lessonFiles.flatMap((file) =>
    auditVocabularyFile(file, fs.readFileSync(file, "utf8")),
  );

  return { lessonFiles, issues };
}

const isMain =
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMain) {
  const { lessonFiles, issues } = runVocabularyAudit();

  if (issues.length) {
    console.error(
      `Vocabulary markdown audit failed with ${issues.length} issue(s):`,
    );
    for (const issue of issues) console.error(`- ${issue}`);
    process.exit(1);
  }

  console.log(
    `Vocabulary markdown audit passed for ${lessonFiles.length} lesson file(s) across N5/N4/N3 vocabulary.`,
  );
}
