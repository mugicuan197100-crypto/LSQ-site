import { escapeHTML, icon } from './ui.js';

const DIRECTIVE = /^:::(steps|checklist|tip|note|warning|success)(?:\s+(.+))?$/;
const FENCE = /^```/;
const LIST_ITEM = /^(?:([-*])|(\d+)\.)\s+(.+)$/;
const HEADING = /^(#{2,4})\s+(.+)$/;

function safeURL(value, image) {
  try {
    if (image && value.startsWith('#')) return '';
    const url = new URL(value, document.baseURI);
    return ['http:', 'https:'].includes(url.protocol) ? value : '';
  } catch {
    return '';
  }
}

function inline(text) {
  const pattern = /(!?)\[([^\]\n]+)\]\(([^)\s]+)\)|`([^`\n]+)`|\*\*([^*\n]+)\*\*|\*([^*\n]+)\*/g;
  let result = '';
  let start = 0;
  for (const match of text.matchAll(pattern)) {
    result += escapeHTML(text.slice(start, match.index));
    const [, image, label, target, code, strong, emphasis] = match;
    if (target) {
      const url = safeURL(target, image);
      if (!url) result += escapeHTML(label);
      else if (image) {
        result += `<img class="article-image" src="${escapeHTML(url)}" alt="${escapeHTML(label)}" loading="lazy">`;
      } else {
        const external = new URL(url, document.baseURI).origin !== location.origin;
        result += `<a href="${escapeHTML(url)}"${external ? ' target="_blank" rel="noopener noreferrer"' : ''}>${escapeHTML(label)}</a>`;
      }
    } else if (code) result += `<code>${escapeHTML(code)}</code>`;
    else if (strong) result += `<strong>${escapeHTML(strong)}</strong>`;
    else result += `<em>${escapeHTML(emphasis)}</em>`;
    start = match.index + match[0].length;
  }
  return result + escapeHTML(text.slice(start));
}

function splitAtHeadings(lines, pattern, firstTitle) {
  const parts = [{ title: firstTitle, lines: [] }];
  let directiveDepth = 0;
  let inCode = false;
  for (const line of lines) {
    const trimmed = line.trim();
    if (FENCE.test(trimmed)) inCode = !inCode;
    if (!inCode) {
      if (DIRECTIVE.test(trimmed)) directiveDepth++;
      else if (trimmed === ':::') directiveDepth = Math.max(0, directiveDepth - 1);
      const heading = directiveDepth === 0 && trimmed.match(pattern);
      if (heading) {
        parts.push({ title: heading[1].trim(), lines: [] });
        continue;
      }
    }
    parts.at(-1).lines.push(line);
  }
  return parts.filter((part, index) => index > 0 || part.lines.some((line) => line.trim()));
}

export function parseSections(body) {
  const used = new Set();
  return splitAtHeadings(body.replace(/\r\n?/g, '\n').split('\n'), /^##\s+(.+)$/, '概览').map((part) => {
    const normalized = part.title.normalize('NFKC').toLowerCase()
      .replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '');
    const base = Array.from(normalized).slice(0, 80).join('') || 'section';
    let slug = base;
    for (let suffix = 2; used.has(slug); suffix++) slug = `${base}-${suffix}`;
    used.add(slug);
    return { ...part, slug };
  });
}

function hashText(text) {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i++) hash = Math.imul(hash ^ text.charCodeAt(i), 16777619);
  return (hash >>> 0).toString(36);
}

function renderChecklist(lines, context, title) {
  const items = lines.flatMap((line) => {
    const match = line.trim().match(/^[-*]\s+(?:\[[ xX]\]\s+)?(.+)$/);
    return match ? [match[1]] : [];
  });
  if (!items.length) return '';
  let done = 0;
  const checks = items.map((item) => {
    const hash = hashText(item);
    const occurrence = (context.checklistKeys.get(hash) ?? 0) + 1;
    context.checklistKeys.set(hash, occurrence);
    const key = `${context.slug}-${hash}-${occurrence}`;
    const checked = context.checked.has(key);
    if (checked) done++;
    return `<label class="check-row">
      <input type="checkbox" data-check-key="${escapeHTML(key)}"${checked ? ' checked' : ''}${context.readonly ? ' disabled' : ''}>
      <span>${inline(item)}</span>
    </label>`;
  }).join('');
  return `<div class="checklist" data-checklist>
    <header><span>${icon('circleCheck')}${escapeHTML(title || '操作检查表')}</span>
      <span class="checklist-count" aria-live="polite">${done} / ${items.length}</span>
    </header>
    <div class="checklist-items">${checks}</div>
    ${context.readonly ? '' : `<div class="checklist-footer"><button type="button" class="text-button" data-action="reset-checklist"${done ? '' : ' disabled'}>${icon('refresh')} 重置检查表</button></div>`}
  </div>`;
}

function directiveEnd(lines, start) {
  let depth = 1;
  let inCode = false;
  for (let i = start + 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (FENCE.test(line)) inCode = !inCode;
    if (inCode) continue;
    if (DIRECTIVE.test(line)) depth++;
    else if (line === ':::' && --depth === 0) return i;
  }
  return -1;
}

function renderDirective(type, title, lines, context, depth) {
  if (type === 'checklist') return renderChecklist(lines, context, title);
  if (type === 'steps') {
    const steps = splitAtHeadings(lines, /^###\s+(.+)$/, '准备工作');
    return `<div class="step-list">${steps.map((step, index) => `
      <details class="step"${index === 0 ? ' open' : ''}>
        <summary><span class="step-index">${index + 1}</span>
          <span>${escapeHTML(step.title)}</span>${icon('down', 'step-chevron')}</summary>
        <div class="step-body">${renderBlocks(step.lines, context, depth + 1)}</div>
      </details>`).join('')}</div>`;
  }

  const types = {
    tip: ['bulb', '实操提示'],
    note: ['info', '说明'],
    warning: ['alert', '注意'],
    success: ['circleCheck', '完成条件'],
  };
  const [symbol, label] = types[type];
  return `<aside class="callout ${type}">${icon(symbol)}
    <div><strong>${escapeHTML(title || label)}</strong>${renderBlocks(lines, context, depth + 1)}</div>
  </aside>`;
}

function tableCells(line) {
  return line.trim().replace(/^\||\|$/g, '').split('|').map((cell) => cell.trim());
}

function tableStarts(lines, index) {
  const next = lines[index + 1];
  return lines[index].includes('|') && !!next?.includes('|')
    && tableCells(next).every((cell) => /^:?-{3,}:?$/.test(cell));
}

function renderBlocks(lines, context, depth = 0) {
  const parts = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i].trim();
    if (!line) {
      i++;
      continue;
    }

    const directive = line.match(DIRECTIVE);
    if (directive && depth < 4) {
      const end = directiveEnd(lines, i);
      if (end !== -1) {
        parts.push(renderDirective(directive[1], directive[2], lines.slice(i + 1, end), context, depth));
        i = end + 1;
        continue;
      }
    }

    if (FENCE.test(line)) {
      const start = ++i;
      while (i < lines.length && !FENCE.test(lines[i].trim())) i++;
      parts.push(`<pre><code>${escapeHTML(lines.slice(start, i).join('\n'))}</code></pre>`);
      i++;
      continue;
    }

    const heading = line.match(HEADING);
    if (heading) {
      const level = heading[1].length;
      parts.push(`<h${level}>${inline(heading[2])}</h${level}>`);
      i++;
      continue;
    }

    if (tableStarts(lines, i)) {
      const headers = tableCells(line);
      const rows = [];
      i += 2;
      while (i < lines.length && lines[i].includes('|')) {
        const cells = tableCells(lines[i]);
        rows.push(`<tr>${headers.map((_, index) => `<td>${inline(cells[index] ?? '')}</td>`).join('')}</tr>`);
        i++;
      }
      parts.push(`<div class="table-wrap" role="region" tabindex="0" aria-label="教程表格">
        <table><thead><tr>${headers.map((cell) => `<th scope="col">${inline(cell)}</th>`).join('')}</tr></thead>
        <tbody>${rows.join('')}</tbody></table></div>`);
      continue;
    }

    const listItem = line.match(LIST_ITEM);
    if (listItem) {
      const ordered = Boolean(listItem[2]);
      const tag = ordered ? 'ol' : 'ul';
      const items = [];
      while (i < lines.length) {
        const item = lines[i].trim().match(LIST_ITEM);
        if (!item || Boolean(item[2]) !== ordered) break;
        items.push(`<li>${inline(item[3])}</li>`);
        i++;
      }
      parts.push(`<${tag}>${items.join('')}</${tag}>`);
      continue;
    }

    const paragraph = [line];
    i++;
    while (i < lines.length) {
      const next = lines[i].trim();
      if (!next || HEADING.test(next) || DIRECTIVE.test(next) || FENCE.test(next)
          || LIST_ITEM.test(next) || tableStarts(lines, i)) break;
      paragraph.push(next);
      i++;
    }
    parts.push(`<p>${inline(paragraph.join(' '))}</p>`);
  }
  return parts.join('');
}

export function renderSection(section, { checked = [], readonly = false } = {}) {
  return `<section class="article-section" id="section-${escapeHTML(section.slug)}" data-section-slug="${escapeHTML(section.slug)}">
    <h2>${escapeHTML(section.title)}</h2>
    ${renderBlocks(section.lines, { slug: section.slug, checked: new Set(checked), readonly, checklistKeys: new Map() })}
  </section>`;
}
