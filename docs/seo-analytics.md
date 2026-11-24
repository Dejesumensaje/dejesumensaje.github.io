# SEO and analytics

## Metadata contract

Every page goes through `src/layouts/Layout.astro`:

- One `<title>`, max 65 characters.
- One meta description, 50–160 characters.
- Canonical URL without `.html`, with trailing slash only on the home.
- Reciprocal `hreflang` for `en`, `es`, `x-default`.
- Open Graph: title, description, URL, type, locale, alternate locale, image,
  image width/height and image alt.
- Twitter card: `summary_large_image` with title, description, image and alt.
- Default robots: `index, follow, max-image-preview:large`.
  The 404 pages use `noindex, nofollow`.
- Author, sitemap link and localized `og:image:alt`.

## Structured data

`Layout.astro` emits a JSON-LD graph on every page:

- `Person` with `@id` `/#person`.
- `WebSite` with `@id` `/#website`.
- `WebPage` with `@id` `<canonical>#webpage`.

`CaseLayout.astro` adds:

- `CreativeWork` for the case study, linked to the Person and WebSite.
- `BreadcrumbList`: Home → Work → Case study.

There must be exactly one `Person` entity per page. Home pages do not add their
own copy; the graph is global.

## Sitemap and robots

- `@astrojs/sitemap` publishes all indexable routes with EN/ES alternates.
- The build script normalizes the home URL to `https://dejesumensaje.com/`.
- `robots.txt` points to the sitemap and keeps `/play/` and `/explorations/`
  out of search.

## Analytics events

GA4 lives in `Layout.astro`. `page_view` is automatic; these events are
delegated from clicks:

| Event | Parameters | Fired by |
|---|---|---|
| `language_switch` | `to_language` | EN/ES switcher |
| `theme_toggle` | `to_theme` | Light/dark toggle |
| `depth_toggle` | `mode` (`full`/`tldr`) | Case reading-depth control |
| `case_study_open` | `label` | Case card |
| `side_project_open` | `label` | Side project card |
| `next_story` | `label` | Next case study |
| `cv_download` | `label` | CV PDF links |
| `email_click` | `label` (`header`/`menu`/`footer`) | Email CTAs |
| `game_start` | `label` (`alborada`) | Footer CRT |
| `outbound_click` | `domain`, `label` | Other external links |

All events also send `page_language`, `page_path` and `transport_type: beacon`.
No PII is sent: labels are page titles or control names.

### GA4 setup

Register these as event-scoped custom dimensions in GA4:

`page_language`, `page_path`, `label`, `to_language`, `to_theme`, `mode`,
`domain`.

Mark the meaningful business events as conversions if needed (for example
`email_click`, `cv_download`, `case_study_open`).

### Consent

GA4 currently loads unconditionally, as it did before this work. Before
targeting EU visitors, add a consent banner and Google Consent Mode v2, and
document it in a privacy page. Do not add new tracking that bypasses consent.

## Checks

```bash
npm test
```

The static suite verifies metadata lengths, canonical/hreflang, social tags,
JSON-LD shape, sitemap and robots. The E2E suite verifies that key analytics
events reach `dataLayer`.
