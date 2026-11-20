import {
  applyDrafts, loadLocal, makeImportDrafts, MAX_IMPORT_BYTES, MAX_TUTORIALS,
  readDrafts, saveLocal, searchTutorials, validateCatalog, validateTutorial,
} from './catalog.js';
import { bindCalculator, renderCalculator } from './calculator.js';
import { bindEditor, renderEditor, renderManager } from './editor.js';
import { emptyState, escapeHTML, icon, platformBadge, platforms, tutorialHref } from './ui.js';
import { renderArticle, renderHome, renderHomeCards, renderLibrary, renderLibraryCards } from './views.js';

const main = document.querySelector('#main');
const sidebar = document.querySelector('#sidebar');
const topbar = document.querySelector('#topbar');
const workspace = document.querySelector('.workspace');
const scrim = document.querySelector('.drawer-scrim');
const searchDialog = document.querySelector('#search-dialog');
const toast = document.querySelector('#toast');
const narrow = matchMedia('(max-width: 860px)');
const shortcut = /Mac|iPhone|iPad/.test(navigator.userAgent) ? '⌘ K' : 'Ctrl K';
const siteName = '跨境实战';

function stringList(value) {
  return Array.isArray(value) ? value.filter((entry) => typeof entry === 'string') : [];
}

function getLearning() {
  const value = loadLocal('learning', {});
  return {
    saved: new Set(stringList(value?.saved)),
    completed: new Set(stringList(value?.completed)),
    checks: new Map(Object.entries(value?.checks ?? {}).map(([id, keys]) => [id, stringList(keys)])),
  };
}

function parseRoute() {
  const [path, query] = location.hash.slice(1).split('?');
  const params = new URLSearchParams(query);
  const platform = params.get('platform');
  if (!path || path === '/') return { name: 'home' };
  if (path === '/library') return { name: 'library', platform: Object.hasOwn(platforms, platform) ? platform : null };
  if (path === '/saved') return { name: 'saved' };
  if (path === '/calculator') return { name: 'calculator' };
  if (path === '/manage') return { name: 'manage' };
  if (path === '/manage/new') return { name: 'editor' };
  const article = path.match(/^\/tutorial\/([a-z0-9-]+)$/);
  if (article) return { name: 'tutorial', id: article[1], section: params.get('section') };
  const editor = path.match(/^\/manage\/edit\/([a-z0-9-]+)$/);
  if (editor) return { name: 'editor', id: editor[1] };
  return { name: 'missing' };
}

const state = {
  route: parseRoute(),
  hash: location.hash,
  loading: true,
  loadError: false,
  base: [],
  items: [],
  drafts: readDrafts(),
  learning: getLearning(),
  learningUnsaved: false,
  homeFilter: 'all',
  list: { query: '', sort: 'default', savedPlatform: 'all' },
  dirty: false,
  drawer: false,
};

function itemById(id) {
  return state.items.find((item) => item.id === id);
}

const navGroups = [
  ['学习导航', [
    ['home', '#/', 'home', '学习中心'],
    ['library', '#/library', 'book', '全部教程'],
    ['shopee', '#/library?platform=shopee', 'bag', 'Shopee 运营'],
    ['tiktok', '#/library?platform=tiktok', 'music', 'TikTok Shop'],
  ]],
  ['个人工作台', [
    ['calculator', '#/calculator', 'calculator', '竞价计算器'],
    ['saved', '#/saved', 'bookmark', '我的收藏'],
  ]],
];

const pageNames = {
  home: '学习中心',
  library: '全部教程',
  saved: '我的收藏',
  tutorial: '教程详情',
  calculator: '竞价计算器',
  manage: '内容管理',
  editor: '内容管理',
  missing: '页面未找到',
};

function showFrame() {
  const { route } = state;
  const platform = route.platform ?? (route.name === 'tutorial' ? itemById(route.id)?.platform : undefined);
  const nav = ['shopee', 'tiktok'].includes(platform) ? platform : route.name === 'tutorial' ? 'library' : route.name;
  const title = route.name === 'library' && platform ? `${platforms[platform].name} 教程` : pageNames[route.name];
  sidebar.innerHTML = `<div class="brand-row">
    <a href="#/" class="brand" aria-label="跨境实战学习中心">
      <span class="brand-icon">${icon('brand')}</span>
      <span><strong>跨境实战</strong><small>电商运营知识库</small></span>
    </a>
    <button class="icon-button drawer-close" type="button" data-action="close-drawer" aria-label="关闭导航">${icon('close')}</button>
  </div>
  <nav class="sidebar-nav" aria-label="主导航">
    ${navGroups.map(([group, links]) => `<div class="nav-group">
      <h2>${group}</h2>
      ${links.map(([id, href, symbol, label]) => `<a href="${href}" class="nav-link${id === nav ? ' active' : ''}"
        ${id === nav ? ' aria-current="page"' : ''}>${icon(symbol)}<span>${label}</span></a>`).join('')}
    </div>`).join('')}
  </nav>
  <div class="learning-panel">
    <div class="learning-title"><span class="learning-icon">${icon('trending')}</span><strong>学习进度</strong></div>
    <div id="learning-status"></div>
  </div>`;
  topbar.innerHTML = `<div class="topbar-label">
    <button class="icon-button drawer-toggle" type="button" data-action="open-drawer" aria-controls="sidebar"
      aria-expanded="false" aria-label="打开导航">${icon('menu')}</button>
    ${icon('layout', 'topbar-layout-icon')}<span>${title}</span>
  </div>
  <div class="topbar-actions">
    <button class="search-trigger" type="button" data-action="search" aria-label="搜索教程和工具" aria-haspopup="dialog">
      ${icon('search')}<span>搜索教程和工具</span><kbd>${shortcut}</kbd>
    </button>
    <a class="button button-dark manage-button" href="#/manage"${['manage', 'editor'].includes(route.name) ? ' aria-current="page"' : ''}>
      ${icon('edit')} <span>内容管理</span>
    </a>
  </div>`;
  updateLearningPanel();
  setDrawer(false, false);
}

function updateLearningPanel() {
  const total = state.items.length;
  const completed = state.items.filter((item) => state.learning.completed.has(item.id)).length;
  const percent = total ? Math.round(completed / total * 100) : 0;
  document.querySelector('#learning-status').innerHTML = `
    <div class="learning-meta"><span>${completed} / ${total} 篇已学</span><span>${percent}%</span></div>
    <progress value="${completed}" max="${total || 1}" aria-label="已学教程进度"></progress>`;
}

function setDrawer(open, moveFocus = true) {
  const wasOpen = state.drawer;
  state.drawer = narrow.matches && open;
  sidebar.dataset.open = state.drawer;
  sidebar.inert = narrow.matches && !state.drawer;
  workspace.inert = state.drawer;
  scrim.hidden = !state.drawer;
  document.body.classList.toggle('drawer-open', state.drawer);
  const toggle = topbar.querySelector('.drawer-toggle');
  toggle?.setAttribute('aria-expanded', state.drawer);
  if (state.drawer && moveFocus) sidebar.querySelector('.drawer-close')?.focus();
  else if (wasOpen && moveFocus && narrow.matches) toggle?.focus();
}

function notFound(title, message) {
  return emptyState('folder', title, message, '<a class="button button-primary" href="#/library">查看教程库</a>');
}

function currentPlatform() {
  return state.route.name === 'saved' ? state.list.savedPlatform : state.route.platform ?? 'all';
}

function updateLibrary() {
  const saved = state.route.name === 'saved';
  const platform = currentPlatform();
  const items = state.items.filter((item) =>
    (!saved || state.learning.saved.has(item.id)) && (platform === 'all' || item.platform === platform));
  const matches = searchTutorials(items, state.list.query);
  if (state.list.sort === 'recent') matches.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  if (state.list.sort === 'duration') matches.sort((a, b) => a.minutes - b.minutes);
  document.querySelector('#library-count').textContent = `${matches.length} 篇教程`;
  document.querySelector('#library-cards').innerHTML = renderLibraryCards(
    matches, state.learning, saved, platform !== 'all' || Boolean(state.list.query.trim()),
  );
  for (const button of main.querySelectorAll('[data-library-filter]')) {
    button.setAttribute('aria-pressed', button.dataset.libraryFilter === platform);
  }
}

function showPage({ focus = false, keepScroll = false } = {}) {
  showFrame();
  const { route, items, learning } = state;
  const entry = itemById(route.id);
  main.classList.toggle('home-page', route.name === 'home');
  document.title = `${entry && route.name === 'tutorial' ? entry.title : pageNames[route.name]} · ${siteName}`;
  if (route.name === 'calculator') {
    main.innerHTML = renderCalculator();
    bindCalculator();
    const guide = main.querySelector('.calc-guide');
    guide.hidden = !itemById('shopee-bidding');
  } else if (state.loading) {
    main.innerHTML = '<div class="page-state"><p>正在加载教程库…</p></div>';
  } else if (state.loadError) {
    main.innerHTML = emptyState('alert', '教程库加载失败', '请重新加载。如果直接打开了 HTML 文件，请先启动本地静态服务器。',
      '<button class="button button-primary" type="button" data-action="retry">重新加载教程库</button>');
  } else if (route.name === 'home') {
    main.innerHTML = renderHome(items, learning, state.homeFilter);
  } else if (route.name === 'library' || route.name === 'saved') {
    main.innerHTML = renderLibrary(route, currentPlatform());
    const input = document.querySelector('#library-search');
    const sort = document.querySelector('#library-sort');
    input.value = state.list.query;
    sort.value = state.list.sort;
    input.addEventListener('input', () => {
      state.list.query = input.value;
      updateLibrary();
    });
    sort.addEventListener('change', () => {
      state.list.sort = sort.value;
      updateLibrary();
    });
    updateLibrary();
  } else if (route.name === 'tutorial') {
    main.innerHTML = entry ? renderArticle(entry, learning, items)
      : notFound('未找到这篇教程', '该教程可能已移动，或仍保存在创建它的浏览器里。');
  } else if (route.name === 'manage') {
    const drafts = state.drafts;
    const changed = drafts.upserts.length > 0 || drafts.removed.length > 0 || drafts.order.length > 0;
    main.innerHTML = renderManager(items, drafts, changed);
    document.querySelector('#catalog-file').addEventListener('change', importCatalog);
  } else if (route.name === 'editor') {
    if (route.id && !entry) main.innerHTML = notFound('未找到这篇教程', '请回到内容管理查看当前教程库。');
    else {
      main.innerHTML = renderEditor(entry);
      bindEditor({
        onChange: () => { state.dirty = true; },
        onSave: (data) => saveTutorial(data, entry),
      });
    }
  } else {
    main.innerHTML = notFound('没有找到这个页面', '从教程库继续浏览。');
  }

  if (!keepScroll) window.scrollTo(0, 0);
  if (focus) main.focus({ preventScroll: true });
  if (route.name === 'tutorial' && entry) {
    requestAnimationFrame(() => {
      if (route.section) jumpToSection(route.section, false);
      updateArticlePosition();
    });
  }
}

function notify(message) {
  window.clearTimeout(notify.timer);
  toast.textContent = message;
  toast.hidden = false;
  notify.timer = window.setTimeout(() => { toast.hidden = true; }, 3400);
}

async function loadCatalog() {
  state.loading = true;
  state.loadError = false;
  showPage();
  try {
    const response = await fetch('content/tutorials.json', { cache: 'no-cache' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    state.base = validateCatalog(await response.json());
    state.drafts = readDrafts();
    state.items = applyDrafts(state.base, state.drafts);
  } catch (error) {
    state.loadError = true;
    console.error('教程库加载失败', error);
  }
  state.loading = false;
  showPage();
  if (searchDialog.open) updateSearch();
}

function saveLearning() {
  const { saved, completed, checks } = state.learning;
  const savedLocally = saveLocal('learning', { saved: [...saved], completed: [...completed], checks: Object.fromEntries(checks) });
  state.learningUnsaved = !savedLocally;
  return savedLocally;
}

function latestLearning() {
  if (!state.learningUnsaved) state.learning = getLearning();
  return state.learning;
}

function toggleBookmark(button) {
  const item = itemById(button.dataset.bookmark);
  if (!item) return;
  const { saved } = latestLearning();
  const next = button.getAttribute('aria-pressed') !== 'true';
  if (next) saved.add(item.id);
  else saved.delete(item.id);
  const persisted = saveLearning();
  const label = next ? '取消收藏' : '收藏';
  button.setAttribute('aria-pressed', next);
  button.setAttribute('aria-label', `${label}《${item.title}》`);
  button.title = label;
  if (button.dataset.bookmarkText === 'true') button.querySelector('span').textContent = next ? '已收藏' : '收藏';
  if (state.route.name === 'saved') {
    updateLibrary();
    document.querySelector('#library-search')?.focus({ preventScroll: true });
  }
  notify(persisted ? (next ? '已加入收藏' : '已取消收藏') : '浏览器存储不可用，收藏仅在当前页面保留。');
}

function toggleComplete(button) {
  const id = button.dataset.complete;
  const { completed } = latestLearning();
  const next = button.getAttribute('aria-pressed') !== 'true';
  if (next) completed.add(id);
  else completed.delete(id);
  const persisted = saveLearning();
  button.setAttribute('aria-pressed', next);
  button.querySelector('span').textContent = next ? '已完成学习' : '标记已学';
  updateLearningPanel();
  notify(persisted ? (next ? '已记录学习进度' : '已取消已学标记') : '浏览器存储不可用，进度仅在当前页面保留。');
}

function updateChecklist(group, changedBox = null) {
  const id = state.route.id;
  const { checks } = latestLearning();
  const checked = new Set(checks.get(id));
  const boxes = [...group.querySelectorAll('input[data-check-key]')];
  if (!changedBox) for (const box of boxes) checked.delete(box.dataset.checkKey);
  else if (changedBox.checked) checked.add(changedBox.dataset.checkKey);
  else checked.delete(changedBox.dataset.checkKey);
  for (const box of boxes) box.checked = checked.has(box.dataset.checkKey);
  if (checked.size) checks.set(id, [...checked]);
  else checks.delete(id);
  const done = boxes.filter((box) => box.checked).length;
  group.querySelector('.checklist-count').textContent = `${done} / ${boxes.length}`;
  group.querySelector('[data-action="reset-checklist"]').disabled = done === 0;
  if (!saveLearning()) notify('浏览器存储不可用，检查进度仅在当前页面保留。');
}

function jumpToSection(slug, animate = true) {
  const target = document.getElementById(`section-${slug}`);
  if (!target) return;
  const smooth = animate && !matchMedia('(prefers-reduced-motion: reduce)').matches;
  target.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
  if (animate) {
    const heading = target.querySelector('h2');
    heading.tabIndex = -1;
    heading.focus({ preventScroll: true });
  }
}

function updateArticlePosition() {
  const content = document.querySelector('#article-content');
  if (!content) return;
  const offset = topbar.getBoundingClientRect().bottom + 42;
  const sections = [...content.querySelectorAll('[data-section-slug]')];
  const current = sections.filter((section) => section.getBoundingClientRect().top <= offset).at(-1) ?? sections[0];
  for (const link of main.querySelectorAll('[data-jump]')) {
    if (link.dataset.jump === current?.dataset.sectionSlug) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  }
  const rect = content.getBoundingClientRect();
  const traveled = Math.max(0, offset - rect.top);
  const distance = Math.max(1, rect.height - window.innerHeight + offset + 36);
  const percent = rect.bottom <= window.innerHeight ? 100 : Math.min(100, Math.round(traveled / distance * 100));
  document.querySelector('#reading-value').textContent = `${percent}%`;
  document.querySelector('#reading-bar').value = percent;
}

let scheduled = false;
function requestReadingUpdate() {
  if (state.route.name !== 'tutorial' || scheduled) return;
  scheduled = true;
  requestAnimationFrame(() => {
    scheduled = false;
    updateArticlePosition();
  });
}

function saveDrafts(drafts) {
  const items = applyDrafts(state.base, drafts);
  if (items.length > MAX_TUTORIALS) throw new Error(`教程库最多可包含 ${MAX_TUTORIALS} 篇教程。`);
  if (!saveLocal('drafts', drafts)) throw new Error('保存失败。浏览器存储不可用或空间不足。');
  state.drafts = drafts;
  state.items = items;
}

function generateId(data, known) {
  const words = data.title.toLowerCase().normalize('NFKC').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const stem = words.slice(0, 50).replace(/-$/, '') || `${data.platform}-${Date.now().toString(36)}`;
  let id = stem;
  for (let suffix = 2; known.has(id); suffix++) id = `${stem}-${suffix}`;
  return id;
}

function saveTutorial(data, original) {
  const drafts = readDrafts();
  const latest = applyDrafts(state.base, drafts);
  const known = new Set([...latest, ...state.base].map(({ id }) => id));
  const manual = data.id.trim();
  const id = original?.id ?? (manual || generateId(data, known));
  if (!original && known.has(id)) throw new Error('此网址标识已被使用，请填写另一个。');
  if (original && JSON.stringify(latest.find((item) => item.id === id)) !== JSON.stringify(original)) {
    throw new Error('这篇教程已在其他标签页变更。请复制当前修改后，重新打开最新版本编辑。');
  }
  const tutorial = validateTutorial({ ...data, id, minutes: Number(data.minutes) });
  saveDrafts({
    ...drafts,
    upserts: [...drafts.upserts.filter((item) => item.id !== id), tutorial],
    removed: drafts.removed.filter((key) => key !== id),
  });
  state.dirty = false;
  navigate(tutorialHref(id));
  notify('教程已保存到当前浏览器');
}

async function importCatalog(event) {
  const input = event.currentTarget;
  const file = input.files[0];
  input.value = '';
  if (!file) return;
  try {
    if (file.size > MAX_IMPORT_BYTES) throw new Error('导入文件最多支持 8 MB。');
    let data;
    try {
      data = JSON.parse((await file.text()).replace(/^\uFEFF/, ''));
    } catch {
      throw new Error('文件不是有效的 JSON。');
    }
    const imported = validateCatalog(data);
    if (state.route.name !== 'manage') return;
    if (!window.confirm(`导入 ${imported.length} 篇教程并替换当前浏览器中的教程库？需要保留当前编辑时，请先导出备份。`)) return;
    saveDrafts(makeImportDrafts(state.base, imported));
    showPage({ keepScroll: true });
    notify(`已导入 ${imported.length} 篇教程`);
  } catch (error) {
    notify(error.message);
  }
}

function exportCatalog() {
  const blob = new Blob([JSON.stringify({ version: 1, tutorials: state.items }, null, 2) + '\n'], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'tutorials.json';
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  notify('已请求下载教程库 JSON');
}

function deleteTutorial(id) {
  const item = itemById(id);
  if (!item || !window.confirm(`从当前浏览器的教程库删除《${item.title}》？`)) return;
  const drafts = readDrafts();
  try {
    saveDrafts({
      upserts: drafts.upserts.filter((tutorial) => tutorial.id !== id),
      removed: [...new Set([...drafts.removed, ...(state.base.some((tutorial) => tutorial.id === id) ? [id] : [])])],
      order: drafts.order.filter((key) => key !== id),
    });
    showPage({ keepScroll: true });
    notify('教程已从当前浏览器的教程库移除');
  } catch (error) {
    notify(error.message);
  }
}

function resetCatalog() {
  if (!window.confirm('恢复站点发布版会清除当前浏览器中的教程修改。继续恢复？')) return;
  try {
    saveDrafts({ upserts: [], removed: [], order: [] });
    showPage({ keepScroll: true });
    notify('已恢复站点发布版');
  } catch (error) {
    notify(error.message);
  }
}

searchDialog.innerHTML = `<div class="search-box">
  <label class="search-dialog-input">${icon('search')}
    <input id="global-search" type="search" placeholder="搜索教程、操作步骤或计算器…" aria-label="搜索教程和工具" maxlength="120" autofocus>
  </label>
  <button class="icon-button" type="button" data-action="close-search" aria-label="关闭搜索">${icon('close')}</button>
</div>
<p class="search-status" id="search-status" aria-live="polite"></p>
<div class="search-results" id="search-results"></div>`;
const search = document.querySelector('#global-search');
const searchResults = document.querySelector('#search-results');
const calculatorIndex = {
  id: 'calculator', title: '竞价计算器', summary: '核算保本最低价、参考出价和利润',
  body: '成本 佣金 手续费 价格 出价 运费', category: '运营工具', platform: 'general',
};

function updateSearch() {
  const query = search.value.trim();
  const matches = searchTutorials([calculatorIndex, ...state.items], query);
  const results = query ? matches.slice(0, 18) : matches.slice(0, 5);
  document.querySelector('#search-status').textContent = query
    ? `${matches.length} 项搜索结果${matches.length > results.length ? ' · 显示前 18 项' : ''}`
    : '快速访问';
  searchResults.innerHTML = results.length ? results.map((item) => {
    const tool = item === calculatorIndex;
    return `<a class="search-result" href="${tool ? '#/calculator' : tutorialHref(item.id)}">
      <span class="search-result-icon">${icon(tool ? 'calculator' : 'book')}</span>
      <span><strong>${escapeHTML(item.title)}</strong><small>${escapeHTML(item.summary)}</small></span>
      ${tool ? '<span class="search-tool-label">运营工具</span>' : platformBadge(item.platform)}
      ${icon('chevron', 'search-arrow')}
    </a>`;
  }).join('') : '<p class="search-no-results">没有找到匹配内容。试试「报名」「同款」或「短视频」。</p>';
}

function openSearch() {
  if (searchDialog.open) {
    search.focus();
    return;
  }
  setDrawer(false, false);
  search.value = '';
  updateSearch();
  searchDialog.showModal();
  search.focus();
}

function navigate(href) {
  if (location.hash === href) return;
  location.hash = href;
}

async function copyLink() {
  const url = location.href;
  try {
    await navigator.clipboard.writeText(url);
    notify('已复制教程链接');
  } catch {
    window.prompt('复制此教程链接', url);
  }
}

const actions = {
  'open-drawer': () => setDrawer(true),
  'close-drawer': () => setDrawer(false),
  search: openSearch,
  'close-search': () => searchDialog.close(),
  retry: loadCatalog,
  'clear-library': () => {
    state.list.query = '';
    state.list.savedPlatform = 'all';
    if (state.route.name === 'library' && state.route.platform) navigate('#/library');
    else {
      const input = document.querySelector('#library-search');
      input.value = '';
      updateLibrary();
      input.focus();
    }
  },
  'copy-link': copyLink,
  print: () => window.print(),
  'reset-checklist': (button) => updateChecklist(button.closest('[data-checklist]')),
  'import-catalog': () => document.querySelector('#catalog-file').click(),
  'export-catalog': exportCatalog,
  'reset-catalog': resetCatalog,
};

document.addEventListener('click', (event) => {
  const target = event.target;
  const action = target.closest('[data-action]');
  if (action) actions[action.dataset.action]?.(action);
  if (target.closest('.skip-link')) {
    event.preventDefault();
    main.focus();
  }
  if (target === scrim) setDrawer(false);
  if (target === searchDialog) searchDialog.close();
  const link = target.closest('a');
  if (link && searchDialog.contains(link)) searchDialog.close();
  if (link && state.drawer && sidebar.contains(link)) setDrawer(false);
  const bookmark = target.closest('[data-bookmark]');
  if (bookmark) toggleBookmark(bookmark);
  const complete = target.closest('[data-complete]');
  if (complete) toggleComplete(complete);
  const removal = target.closest('[data-delete]');
  if (removal) deleteTutorial(removal.dataset.delete);
  const homeFilter = target.closest('[data-home-filter]');
  if (homeFilter) {
    state.homeFilter = homeFilter.dataset.homeFilter;
    for (const button of main.querySelectorAll('[data-home-filter]')) button.setAttribute('aria-pressed', button === homeFilter);
    document.querySelector('#home-cards').innerHTML = renderHomeCards(state.items, state.learning, state.homeFilter);
    document.querySelector('#home-all').href = `#/library${state.homeFilter === 'all' ? '' : `?platform=${state.homeFilter}`}`;
  }
  const libraryFilter = target.closest('[data-library-filter]');
  if (libraryFilter) {
    const value = libraryFilter.dataset.libraryFilter;
    if (state.route.name === 'saved') {
      state.list.savedPlatform = value;
      updateLibrary();
    } else navigate(value === 'all' ? '#/library' : `#/library?platform=${value}`);
  }
  const jump = target.closest('[data-jump]');
  if (jump && !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey) {
    event.preventDefault();
    jump.closest('.mobile-toc')?.removeAttribute('open');
    const section = jump.dataset.jump;
    const url = tutorialHref(state.route.id, section);
    history.replaceState(null, '', url);
    state.hash = url;
    state.route.section = section;
    jumpToSection(section);
  }
});

main.addEventListener('change', (event) => {
  if (event.target.matches('input[data-check-key]') && state.route.name === 'tutorial') {
    updateChecklist(event.target.closest('[data-checklist]'), event.target);
  }
});
main.addEventListener('toggle', requestReadingUpdate, true);
main.addEventListener('load', requestReadingUpdate, true);
search.addEventListener('input', updateSearch);
searchDialog.addEventListener('keydown', (event) => {
  const links = [...searchResults.querySelectorAll('a')];
  if (!links.length) return;
  if (event.key === 'Enter' && event.target === search) {
    event.preventDefault();
    links[0].click();
  }
  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
    const index = links.indexOf(document.activeElement);
    const next = event.key === 'ArrowDown' ? Math.min(links.length - 1, index + 1) : index - 1;
    event.preventDefault();
    (links[next] ?? search).focus();
  }
});

document.addEventListener('keydown', (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k' && !event.altKey) {
    event.preventDefault();
    openSearch();
  }
  if (event.key === 'Escape' && state.drawer) setDrawer(false);
});

window.addEventListener('hashchange', () => {
  if (state.dirty && !window.confirm('当前修改尚未保存。离开编辑页？')) {
    history.replaceState(null, '', state.hash || '#/');
    return;
  }
  state.dirty = false;
  state.hash = location.hash;
  const next = parseRoute();
  if (state.route.name !== next.name) state.list = { query: '', sort: 'default', savedPlatform: 'all' };
  state.route = next;
  showPage({ focus: true });
});

window.addEventListener('beforeunload', (event) => {
  if (state.dirty) {
    event.preventDefault();
    event.returnValue = '';
  }
});

window.addEventListener('storage', (event) => {
  if (event.key === 'lsq-commerce:drafts' && state.route.name !== 'editor' && !state.loading) {
    state.drafts = readDrafts();
    state.items = applyDrafts(state.base, state.drafts);
    showPage({ keepScroll: true });
    if (searchDialog.open) updateSearch();
  }
});

let closedSteps = [];
window.addEventListener('beforeprint', () => {
  closedSteps = [...main.querySelectorAll('details.step:not([open])')];
  for (const step of closedSteps) step.open = true;
});
window.addEventListener('afterprint', () => {
  for (const step of closedSteps) step.open = false;
  closedSteps = [];
});
window.addEventListener('scroll', requestReadingUpdate, { passive: true });
window.addEventListener('resize', requestReadingUpdate);
narrow.addEventListener('change', () => setDrawer(false, false));
history.scrollRestoration = 'manual';
loadCatalog();
