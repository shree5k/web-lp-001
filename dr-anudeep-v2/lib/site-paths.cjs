const fs = require('node:fs');
const path = require('node:path');

function normalizePathPrefix(value = '') {
  if (value === '' || value === '/') return '';
  if (typeof value !== 'string' || !/^\/(?:[a-z0-9._-]+\/?)+$/i.test(value)
    || value.split('/').some(part => part === '.' || part === '..')) {
    throw new Error('SITE_PATH_PREFIX must be a path such as /repository-name, without a domain, query or traversal');
  }
  return value.replace(/\/$/, '');
}

function prefixHtml(html, value = '') {
  const prefix = normalizePathPrefix(value);
  if (!prefix) return html;
  const local = url => url.startsWith('/') && !url.startsWith('//') ? prefix + url : url;
  return html.replace(/\b(href|src|poster|action|srcset)\s*=\s*(["'])(.*?)\2/gi, (_, attribute, quote, url) => {
    const rewritten = attribute.toLowerCase() === 'srcset'
      ? url.replace(/(^|,\s*)(\/[^\s,]+)(?=\s|,|$)/g, (match, start, src) => start + local(src))
      : local(url);
    return `${attribute}=${quote}${rewritten}${quote}`;
  });
}

function finalizeOutput(directory, { pathPrefix = '', preview = false } = {}) {
  const prefix = normalizePathPrefix(pathPrefix);
  function walk(folder) {
    for (const entry of fs.readdirSync(folder, { withFileTypes: true })) {
      const filename = path.join(folder, entry.name);
      if (entry.isDirectory()) walk(filename);
      else if (filename.endsWith('.html')) {
        let html = prefixHtml(fs.readFileSync(filename, 'utf8'), prefix);
        if (preview && !/<meta\b[^>]*name="robots"[^>]*content="[^"]*noindex/i.test(html)) {
          html = html.replace('</head>', '<meta name="robots" content="noindex, nofollow"></head>');
        }
        fs.writeFileSync(filename, html);
      }
    }
  }
  walk(directory);
}

module.exports = { normalizePathPrefix, prefixHtml, finalizeOutput };
