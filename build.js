const fs = require('fs');
const path = require('path');
const { minify: terserMinify } = require('terser');
const CleanCSS = require('clean-css');
const JavaScriptObfuscator = require('javascript-obfuscator');
const { minify: htmlMinify } = require('html-minifier-terser');

const INPUT_FILES = ['index.html', 'projects.html'];
const OUT_DIR = path.join(__dirname, 'dist');
const ASSETS_DIR = path.join(OUT_DIR, 'assets');
const CSS_OUT = path.join(ASSETS_DIR, 'styles.main.min.css');
const JS_OUT = path.join(ASSETS_DIR, 'main.obf.js');

function ensureDir(p){ if(!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true }); }

async function buildSite(){
  ensureDir(OUT_DIR);
  ensureDir(ASSETS_DIR);

  let combinedCSS = '';
  const pageScripts = new Map();

  // Read each HTML and extract inline style/script blocks
  for(const file of INPUT_FILES){
    const src = fs.readFileSync(path.join(__dirname, file), 'utf8');
    let combinedJS = '';

    // Extract <style> blocks
    const styleRegex = /<style[^>]*>([\s\S]*?)<\/style>/gi;
    let m;
    while((m = styleRegex.exec(src)) !== null){ combinedCSS += '\n' + m[1].trim(); }

    // Extract inline <script> blocks (exclude scripts with src)
    const scriptRegex = /<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi;
    while((m = scriptRegex.exec(src)) !== null){ combinedJS += '\n' + m[1].trim(); }

    pageScripts.set(file, combinedJS);
  }

  // Minify CSS
  const minifiedCSS = new CleanCSS({ level: 2 }).minify(combinedCSS).styles;
  fs.writeFileSync(CSS_OUT, minifiedCSS, 'utf8');
  console.log('Wrote minified CSS ->', CSS_OUT);

  // For each HTML, remove inline style/script and inject links to minified assets, then minify HTML
  for(const file of INPUT_FILES){
    let html = fs.readFileSync(path.join(__dirname, file), 'utf8');
    const pageJsOut = path.join(ASSETS_DIR, `${path.parse(file).name}.obf.js`);
    const pageCombinedJS = pageScripts.get(file) || '';

    // Minify JS with terser per page so duplicate top-level variable names do not collide
    const terserResult = await terserMinify(pageCombinedJS, { ecma: 2019, compress: true, mangle: true });
    const minifiedJS = terserResult.code || '';

    // Obfuscate JS per page
    const obfResult = JavaScriptObfuscator.obfuscate(minifiedJS, {
      compact: true,
      controlFlowFlattening: true,
      controlFlowFlatteningThreshold: 0.75,
      disableConsoleOutput: true,
      numbersToExpressions: true,
      simplify: true,
      splitStrings: true,
      stringArray: true,
      stringArrayEncoding: ['rc4'],
      stringArrayThreshold: 0.75
    }).getObfuscatedCode();

    fs.writeFileSync(pageJsOut, obfResult, 'utf8');
    console.log('Wrote obfuscated JS ->', pageJsOut);

    // Remove inline <style> blocks
    html = html.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
    // Remove inline <script> blocks without src
    html = html.replace(/<script(?![^>]*\bsrc=)[^>]*>[\s\S]*?<\/script>/gi, '');

    // Insert link to CSS before closing </head>
    html = html.replace(/<\/head>/i, `  <link rel="stylesheet" href="/assets/${path.basename(CSS_OUT)}">\n</head>`);

    // Insert script include before closing </body>
    html = html.replace(/<\/body>/i, `  <script src="/assets/${path.basename(pageJsOut)}" defer></script>\n</body>`);

    // Minify final HTML
    const minifiedHtml = await htmlMinify(html, {
      collapseWhitespace: true,
      removeComments: true,
      removeRedundantAttributes: true,
      removeScriptTypeAttributes: true,
      removeStyleLinkTypeAttributes: true,
      useShortDoctype: true,
      minifyCSS: false, // CSS already minified
      minifyJS: false // JS already minified/obfuscated
    });

    const outPath = path.join(OUT_DIR, file);
    fs.writeFileSync(outPath, minifiedHtml, 'utf8');
    console.log('Wrote optimized HTML ->', outPath);
  }

  console.log('\nBuild complete. Output in /dist.');
  console.log('Deploy the /dist contents to Vercel or your static host.');
}

buildSite().catch(err => { console.error(err); process.exit(1); });
