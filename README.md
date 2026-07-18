# Austin Woyshnar — Portfolio & Writing

A content-first personal site built with Astro. It includes a homepage, writing archive, project shelf, about page, and the complete interactive edition of **The Watershed**.

## Work locally

```sh
npm install
npm run dev
```

The local site is normally available at `http://localhost:4321`.

## Publish a standard article

1. Copy `src/content/writing/_template.md` to a descriptive filename such as `my-new-essay.md`.
2. Fill in the title, description, date, and topics at the top.
3. Write the article in Markdown.
4. Change `draft: true` to `draft: false`.
5. Run `npm run build` to catch missing or invalid metadata.

Published Markdown articles automatically appear on `/writing/` and receive their own page.

## Add a custom interactive project

Use `src/pages/` for a page built with Astro components, or keep a custom experience's static CSS, JavaScript, and media under `public/`. The Watershed combines both: its HTML route is `src/pages/writing/the-watershed/index.html`, while its existing styles, scripts, and assets remain intact in `public/writing/the-watershed/`.

## Deploy to GitHub Pages

The site deploys automatically to <https://amoney-letitrip.github.io/> whenever a commit is pushed to `main`. The deployment workflow lives in `.github/workflows/deploy.yml`.

Before connecting a custom domain, update the default author name, About copy, social links, and contact details to the exact information you want public.
