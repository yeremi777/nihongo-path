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
  const issues = [];
  const push = (message) => issues.push(`${rel(file)}: ${message}`);

  auditCommonLessonShell(text, push, {
    requiredSections: REQUIRED_SECTIONS,
    wordStripSection: "Peta Pola",
  });

  const polaHariIni = section(text, "Pola Hari Ini");
  if (!/^\|[^\n]+\|\s*$/m.test(polaHariIni)) {
    push("## Pola Hari Ini must include a pattern summary table");
  }

  const bangunKalimat = section(text, "Bangun Kalimat Bertahap");
  if (!/^\|[^\n]+\|\s*$/m.test(bangunKalimat)) {
    push("## Bangun Kalimat Bertahap must include a step-build table");
  }

  auditContohKalimat(section(text, "Contoh Kalimat"), push);
  auditNoMarkdownFurigana(text, push);
  auditFuriganaQuality(text, push);
  auditMiniPractice(text, push);
  auditGrammarPlaceholders(text, push);

  return issues;
};

export function runGrammarAudit() {
  const lessonFiles = collectGrammarLessonFiles();
  const issues = lessonFiles.flatMap((file) =>
    auditGrammarFile(file, fs.readFileSync(file, "utf8")),
  );

  return { lessonFiles, issues };
}

const isMain =
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMain) {
  const { lessonFiles, issues } = runGrammarAudit();

  if (issues.length) {
    console.error(
      `Grammar markdown audit failed with ${issues.length} issue(s):`,
    );
    for (const issue of issues) console.error(`- ${issue}`);
    process.exit(1);
  }

  console.log(
    `Grammar markdown audit passed for ${lessonFiles.length} grammar lesson file(s).`,
  );
}
