# Nihongo Path

Nihongo Path is a curriculum-first JLPT learning website built with Nuxt, Nuxt Content, Tailwind CSS, and Nuxt Color Mode.

## Requirements

- Node `^20.19.0 || >=22.12.0`
- pnpm 10+

The current local project has been verified with Homebrew Node `v20.20.2`.

## Run Locally

Install dependencies:

```bash
pnpm install
```

Start the local development server only when you intentionally want to preview the site:

```bash
pnpm dev
```

Then open the local URL printed by Nuxt.

For normal verification after code changes, prefer running a build instead of automatically starting the dev server:

```bash
pnpm build
```

## Development Safety

This project uses a cautious development workflow.

Do not automatically run long-running development servers, Git commit/push commands, publish commands, release commands, or deploy commands.

Avoid running these commands unless explicitly requested:

```bash
pnpm dev
npm run dev
npm start
yarn dev
bun dev
git commit
git push
git tag
npm publish
pnpm publish
```

After making code changes, summarize the changed files and suggest which command should be run manually.

## Content

Lessons live in `content/learn`. Add future lessons as Markdown files with frontmatter for `title`, `description`, `level`, `category`, `week`, `day`, `order`, and `status`.
