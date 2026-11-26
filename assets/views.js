import { emptyState, escapeHTML, icon, platformBadge, platforms, platformTile, tutorialHref } from './ui.js';
import { parseSections, renderSection } from './markdown.js';

export const filters = [
  ['all', '全部'], ['shopee', 'Shopee'], ['tiktok', 'TikTok Shop'], ['general', '跨境通用'],
];

const allTutorials = '<a href="#/library" class="button button-outline">浏览全部教程</a>';

function bookmarkButton(item, saved, text = false) {
  const label = saved ? '取消收藏' : '收藏';
  return `<button class="${text ? 'button button-outline' : 'icon-button bookmark-button'}"
    type="button" data-bookmark="${item.id}" data-bookmark-text="${text}" aria-pressed="${saved}"
    aria-label="${label}《${escapeHTML(item.title)}》" title="${label}">
      ${icon('bookmark')}${text ? `<span>${saved ? '已收藏' : '收藏'}</span>` : ''}
    </button>`;
}

function tutorialCard(item, learning) {
  const completed = learning.completed.has(item.id);
  return `<article class="tutorial-card">
    <div class="card-art">
      <img src="assets/${item.cover}.webp" alt="" width="840" height="415" loading="lazy">
    </div>
    <div class="card-main">
      <div class="card-meta">${platformBadge(item.platform)}<span>${escapeHTML(item.category)}</span></div>
      <h3><a href="${tutorialHref(item.id)}">${escapeHTML(item.title)}</a></h3>
      <p>${escapeHTML(item.summary)}</p>
      <div class="card-footer">
        <span>${icon('clock')} ${item.minutes} 分钟 <span class="meta-dot" aria-hidden="true"></span> ${escapeHTML(item.level)}</span>
        ${completed ? `<span class="card-completed">${icon('circleCheck')} 已学</span>` : ''}
        ${bookmarkButton(item, learning.saved.has(item.id))}
      </div>
    </div>
  </article>`;
}

export function renderTutorialCards(items, learning) {
  return `<div class="tutorial-grid">${items.map((item) => tutorialCard(item, learning)).join('')}</div>`;
}

function filterButtons(selected, scope) {
  return `<div class="filters" role="group" aria-label="按平台筛选">${filters.map(([id, name]) => `
    <button type="button" data-${scope}-filter="${id}" aria-pressed="${selected === id}">${name}</button>`).join('')}</div>`;
}

function platformCard(key, items) {
  const info = platforms[key];
  const count = items.filter((item) => item.platform === key).length;
  return `<a href="#/library?platform=${key}" class="platform-card">
    ${platformTile(key)}
    <span class="platform-card-copy"><strong>${info.name}</strong><span>${info.description}</span></span>
    <span class="platform-count">${count} 篇教程</span>
    ${icon('chevron', 'platform-arrow')}
  </a>`;
}

export function renderHome(items, learning, selected) {
  const lead = items.find(({ id }) => id === 'shopee-bidding') ?? items[0];
  return `<section class="hero" aria-labelledby="hero-title">
    <img class="hero-image" src="assets/hero.webp" alt="" width="1280" height="853" fetchpriority="high">
    <div class="hero-shade"></div>
    <div class="hero-content">
      <span class="hero-pill"><span></span> SHOPEE <b>×</b> TIKTOK SHOP</span>
      <h1 id="hero-title">跨境电商运营<br>实战手册</h1>
      <p>从虾皮竞价到短视频带货，掌握跨境店铺的运营流程。</p>
      <div class="hero-actions">
        ${lead ? `<a class="button button-primary" href="${tutorialHref(lead.id)}">
          ${lead.id === 'shopee-bidding' ? '学习虾皮竞价' : '开始学习'} ${icon('arrow')}
        </a>` : ''}
        <a class="button button-hero" href="#/library">浏览全部教程</a>
      </div>
    </div>
  </section>
  <section class="home-section" aria-labelledby="platform-heading">
    <div class="section-heading"><h2 id="platform-heading">按平台学习</h2></div>
    <div class="platform-grid">${platformCard('shopee', items)}${platformCard('tiktok', items)}</div>
  </section>
  <section class="home-section" aria-labelledby="tutorial-heading">
    <div class="section-heading section-heading-filters">
      <h2 id="tutorial-heading">实战教程</h2>${filterButtons(selected, 'home')}
    </div>
    <div id="home-cards">${renderHomeCards(items, learning, selected)}</div>
    <a class="section-link" id="home-all" href="#/library${selected === 'all' ? '' : `?platform=${selected}`}">查看全部教程 ${icon('arrow')}</a>
  </section>
  <section class="home-section home-tool-section" aria-labelledby="tools-heading">
    <div class="section-heading"><h2 id="tools-heading">运营工具</h2></div>
    <a class="tool-card" href="#/calculator">
      <span class="platform-tile general">${icon('calculator')}</span>
      <span><strong>竞价计算器</strong><span>算清保本价，再决定出价。</span></span>
      ${icon('arrow', 'platform-arrow')}
    </a>
  </section>`;
}

export function renderHomeCards(items, learning, selected) {
  const filtered = selected === 'all' ? items : items.filter((item) => item.platform === selected);
  return filtered.length
    ? renderTutorialCards(filtered.slice(0, 3), learning)
    : emptyState('book', '暂无匹配教程', '选择其他平台查看已经发布的教程。');
}

export function renderLibrary(route, selected) {
  const saved = route.name === 'saved';
  const platform = route.platform && platforms[route.platform];
  const title = saved ? '我的收藏' : platform ? `${platform.name} 教程` : '全部教程';
  const description = saved ? '收藏常用教程，方便下次继续阅读。'
    : platform ? platform.description : '按平台筛选，在教程正文中搜索需要的操作步骤。';
  const symbol = saved ? 'bookmark' : platform?.icon ?? 'book';
  return `<div class="page-heading">
    <span class="page-heading-icon ${route.platform ?? 'blue'}">${icon(symbol)}</span>
    <div><h1>${title}</h1><p>${description}</p></div>
  </div>
  <div class="library-toolbar">
    ${filterButtons(selected, 'library')}
    <div class="library-inputs">
      <label class="library-search">${icon('search')}
        <input id="library-search" type="search" placeholder="搜索教程或关键词" aria-label="搜索当前教程列表" maxlength="120">
      </label>
      <select id="library-sort" aria-label="排序">
        <option value="default">默认排序</option><option value="recent">最近更新</option><option value="duration">阅读时长</option>
      </select>
    </div>
  </div>
  <p class="library-count" id="library-count" aria-live="polite"></p>
  <div id="library-cards"></div>`;
}

export function renderLibraryCards(items, learning, saved, filtering) {
  if (items.length) return renderTutorialCards(items, learning);
  if (saved && !filtering) {
    return emptyState('bookmark', '还没有收藏', '点击教程上的收藏图标，把它加入此列表。', allTutorials);
  }
  return emptyState('search', '找不到符合条件的教程', '试试更短的关键词，或选择其他平台。',
    `<button class="button button-outline" type="button" data-action="clear-library">清除筛选</button>`);
}

function renderToc(item, sections, mobile = false) {
  const links = sections.map((section, index) =>
    `<li><a href="${tutorialHref(item.id, section.slug)}" data-jump="${escapeHTML(section.slug)}"${index === 0 ? ' aria-current="location"' : ''}>${escapeHTML(section.title)}</a></li>`).join('');
  if (mobile) {
    return `<details class="mobile-toc">
      <summary>${icon('list')} 本篇目录 ${icon('down')}</summary><ol>${links}</ol>
    </details>`;
  }
  return `<div class="toc-card">
    <h2>${icon('list')} 本篇目录</h2><ol>${links}</ol>
    <div class="reading-progress">
      <div><span>阅读进度</span><span id="reading-value">0%</span></div>
      <progress id="reading-bar" value="0" max="100" aria-label="阅读进度"></progress>
    </div>
  </div>`;
}

export function renderArticle(item, learning, items) {
  const sections = parseSections(item.body);
  const completed = learning.completed.has(item.id);
  const position = items.findIndex((other) => other.id === item.id);
  const next = items.slice(position + 1).find((other) => other.platform === item.platform)
    ?? items.find((other) => other.id !== item.id && other.platform === item.platform)
    ?? items.find((other) => other.id !== item.id);
  const calculator = item.id === 'shopee-bidding' || item.id === 'cross-border-pricing';
  return `<nav aria-label="面包屑" class="breadcrumbs">
    <a href="#/library">全部教程</a>${icon('chevron')}
    <a href="#/library?platform=${item.platform}">${platforms[item.platform].name}</a>${icon('chevron')}
    <span aria-current="page">${escapeHTML(item.title)}</span>
  </nav>
  <div class="article-layout">
    <article class="article-column">
      <header class="article-header cover-${item.cover}">
        <img src="assets/${item.cover}.webp" alt="" width="840" height="415">
        <div class="article-header-content">
          <div class="card-meta">${platformBadge(item.platform)} <span>${escapeHTML(item.category)}</span></div>
          <h1>${escapeHTML(item.title)}</h1>
          <p>${escapeHTML(item.summary)}</p>
          <div class="article-meta">
            <span>${icon('clock')} ${item.minutes} 分钟</span>
            <span>${icon('calendar')} <time datetime="${item.updatedAt}">${item.updatedAt}</time></span>
            <span class="level-label">${escapeHTML(item.level)}</span>
          </div>
        </div>
      </header>
      <div class="article-toolbar">
        <button class="button button-outline completion-button" type="button" data-complete="${item.id}" aria-pressed="${completed}">
          ${icon('circleCheck')} <span>${completed ? '已完成学习' : '标记已学'}</span>
        </button>
        ${bookmarkButton(item, learning.saved.has(item.id), true)}
        <button class="button button-outline article-utility" type="button" data-action="copy-link" title="复制链接">${icon('copy')} <span>复制链接</span></button>
        <button class="button button-outline article-utility" type="button" data-action="print" title="打印教程">${icon('print')} <span>打印</span></button>
      </div>
      ${renderToc(item, sections, true)}
      <div class="article-content" id="article-content">
        ${sections.map((section) => renderSection(section, { checked: learning.checks.get(item.id) ?? [] })).join('')}
      </div>
      ${next ? `<a href="${tutorialHref(next.id)}" class="next-tutorial">
        <span><small>继续学习</small><strong>${escapeHTML(next.title)}</strong></span>${icon('arrow')}
      </a>` : ''}
    </article>
    <aside class="article-aside" aria-label="教程导航">
      ${renderToc(item, sections)}
      ${calculator ? `<a href="#/calculator" class="aside-tool">
        <span class="platform-tile general">${icon('calculator')}</span>
        <span><strong>竞价计算器</strong><small>测算保本价与拟出价</small></span>${icon('chevron')}
      </a>` : ''}
    </aside>
  </div>`;
}
