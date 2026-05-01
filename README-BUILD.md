Build and deploy (minify + obfuscate)

1) Install dev dependencies:

```bash
npm install
```

2) Run the build script (produces `dist/`):

```bash
npm run build
```

3) Deploy the contents of the `dist/` folder to Vercel (or any static host).

Notes & precautions:
- The build script extracts inline `<style>` and inline `<script>` blocks from `index.html` and `projects.html`, combines them, minifies CSS, minifies+obfuscates JS, and injects external references in the generated HTML inside `dist/`.
- Because the script concatenates inline JS into one bundle, there can be ordering issues if your inline scripts rely on being in a particular location or interleave with inline HTML. Test thoroughly.
- Obfuscation increases difficulty of reverse-engineering but does not make code secret. Keep sensitive logic on the server.
- If you prefer a safer approach, I can instead move each inline script to its own file and minify/obfuscate individually to keep behavior identical.
