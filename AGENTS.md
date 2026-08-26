## Project Configuration

- **Language**: TypeScript
- **Package Manager**: npm
- **Add-ons**: prettier, eslint, vitest, playwright, tailwindcss, sveltekit-adapter, drizzle, better-auth, mcp

---

## Fairtree Brand Guidelines (CRITICAL)

When modifying or creating user interface components for this project, you MUST strictly adhere to the Fairtree brand guidelines:

1. **Design System & Style Guide:** Always check [layout.css](src/routes/layout.css) first. It specifies colors (e.g. brand orange `#cb6423`, dark charcoal `#1f1f22`, badge teal `#177f99`), typography hierarchy scales (`RecifeDisplay` serif / `Raleway` sans-serif), and custom bottom-bordered links.
2. **Golden Rule (Zero Border-Radius):** Enforce strict sharp corners (`border-radius: 0px` / class `.sharp-corners`) on all buttons, forms, inputs, badges, tables, and cards. No rounded borders are allowed.
3. **Landing Page:** The base page is at `/` ([src/routes/+page.svelte](src/routes/+page.svelte)).

---

You are able to use the Svelte MCP server, where you have access to comprehensive Svelte 5 and SvelteKit documentation. Here's how to use the available tools effectively:

## Available Svelte MCP Tools:

### 1. list-sections

Use this FIRST to discover all available documentation sections. Returns a structured list with titles, use_cases, and paths.
When asked about Svelte or SvelteKit topics, ALWAYS use this tool at the start of the chat to find relevant sections.

### 2. get-documentation

Retrieves full documentation content for specific sections. Accepts single or multiple sections.
After calling the list-sections tool, you MUST analyze the returned documentation sections (especially the use_cases field) and then use the get-documentation tool to fetch ALL documentation sections that are relevant for the user's task.

### 3. svelte-autofixer

Analyzes Svelte code and returns issues and suggestions.
You MUST use this tool whenever writing Svelte code before sending it to the user. Keep calling it until no issues or suggestions are returned.

### 4. playground-link

Generates a Svelte Playground link with the provided code.
After completing the code, ask the user if they want a playground link. Only call this tool after user confirmation and NEVER if code was written to files in their project.

## Cloudflare Wrangler Tools:

If not started, you can run `vp run dev` to start the local development server.

You then have access to local Cloudflare services (KV, R2, D1, Durable Objects, and Workflows) for this app via the Explorer API.
API endpoint: http://localhost:8787/cdn-cgi/explorer/api.
Fetch the OpenAPI schema from http://localhost:8787/cdn-cgi/explorer/api to discover available operations. Use these endpoints to list, query, and manage local resources during development.

<!--VITE PLUS START-->

# Using Vite+, the Unified Toolchain for the Web

This project is using Vite+, a unified toolchain built on top of Vite, Rolldown, Vitest, tsdown, Oxlint, Oxfmt, and Vite Task. Vite+ wraps runtime management, package management, and frontend tooling in a single global CLI called `vp`. Vite+ is distinct from Vite, and it invokes Vite through `vp dev` and `vp build`. Run `vp help` to print a list of commands and `vp <command> --help` for information about a specific command.

Docs are local at `node_modules/vite-plus/docs` or online at https://viteplus.dev/guide/.

## Review Checklist

- [ ] Run `vp install` after pulling remote changes and before getting started.
- [ ] Run `vp check` and `vp test` to format, lint, type check and test changes.
- [ ] Check if there are `vite.config.ts` tasks or `package.json` scripts necessary for validation, run via `vp run <script>`.
- [ ] If setup, runtime, or package-manager behavior looks wrong, run `vp env doctor` and include its output when asking for help.

<!--VITE PLUS END-->

## Implementation Guardrails

- **Svelte 5 Runes**: Strictly use `$state`, `$derived`, and snippets. No legacy stores.
- **Package Management**: Never change `package-lock.json` manually. It should only be changed via `vp`.
- **Deprecations**: Make sure NO deprecated imports are used.
- **Clean Code**: Make sure no unused variables, functions or imports are left in the code.

## Never do this

- Don't use `any` as a type.
- Avoid using `$effect`
- Don't add eslint ignore comments without asking
- User '@lucide/svelte' instead of the deprecated 'lucide-svelte' for importing lucide icons
