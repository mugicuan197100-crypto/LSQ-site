import { today } from './catalog.js';
import { covers, emptyState, escapeHTML, icon, platformBadge, platforms, tutorialHref } from './ui.js';
import { parseSections, renderSection } from './markdown.js';

const starter = '## 适用范围\n\n写下适用站点、商品类目与准备条件。\n\n## 操作流程\n\n1. 写下第一步。\n2. 说明如何确认操作完成。\n';

const snippets = {
  heading: '\n\n## 新章节\n\n',
  bold: (selected) => `**${selected || '重点内容'}**`,
  list: '\n\n- 第一项\n- 第二项\n',
  image: '\n\n![截图说明](content/images/example.png)\n\n',
  checklist: '\n\n:::checklist 发布前检查\n- 检查第一项。\n- 检查第二项。\n:::\n\n',
  steps: '\n\n:::steps\n### 第一步\n\n写下操作与完成条件。\n\n### 第二步\n\n写下需要核对的结果。\n:::\n\n',
  note: '\n\n:::tip 操作提示\n写下关键提醒。\n:::\n\n',
};

export function renderManager(items, drafts, changed) {
  const overrides = new Set(drafts.upserts.map(({ id }) => id));
  return `<div class="page-heading manager-heading">
    <span class="page-heading-icon warm">${icon('edit')}</span>
    <div><h1>内容管理</h1><p>新建、维护和发布你的教程库。</p></div>
    <a class="button button-primary" href="#/manage/new">${icon('plus')} 新建教程</a>
  </div>
  <aside class="callout note manager-note">${icon('info')}<div>
    <strong>本地编辑与发布</strong>
    <p>修改保存在当前浏览器。要让访客看到更新，导出教程库并在站点仓库中替换 <code>content/tutorials.json</code>。</p>
  </div></aside>
  <section class="surface manager-surface">
    <div class="surface-heading manager-toolbar">
      <h2>教程库 <span>${items.length} 篇</span></h2>
      <div class="button-group">
        <button class="button button-outline" type="button" data-action="import-catalog">${icon('upload')} 导入 JSON</button>
        <button class="button button-outline" type="button" data-action="export-catalog">${icon('download')} 导出 JSON</button>
        <input type="file" id="catalog-file" accept=".json,application/json" hidden>
      </div>
    </div>
    ${items.length ? `<ul class="management-list">${items.map((item) => `<li>
        <img src="assets/${item.cover}.webp" alt="" width="76" height="48" loading="lazy">
        <div class="management-copy">
          <a href="${tutorialHref(item.id)}">${escapeHTML(item.title)}</a>
          <div>${platformBadge(item.platform)} <time datetime="${item.updatedAt}">${item.updatedAt}</time>${overrides.has(item.id) ? '<span class="draft-label">本地草稿</span>' : ''}</div>
        </div>
        <a class="button button-outline button-small" href="#/manage/edit/${item.id}" aria-label="编辑《${escapeHTML(item.title)}》">${icon('edit')} 编辑</a>
        <button class="icon-button delete-button" type="button" data-delete="${item.id}" aria-label="删除《${escapeHTML(item.title)}》" title="删除教程">${icon('trash')}</button>
      </li>`).join('')}</ul>` : emptyState('book', '教程库为空', '新建一篇教程，或从备份导入内容。')}
    ${changed ? `<div class="manager-footer">
      <button class="text-button" type="button" data-action="reset-catalog">${icon('refresh')} 恢复站点发布版</button>
    </div>` : ''}
  </section>`;
}

function options(values, selected) {
  return values.map(([value, label]) =>
    `<option value="${escapeHTML(value)}"${value === selected ? ' selected' : ''}>${escapeHTML(label)}</option>`).join('');
}

export function renderEditor(original) {
  const item = original ?? {
    id: '', platform: 'shopee', category: '', title: '', summary: '',
    minutes: 8, level: '入门', updatedAt: today(), cover: 'bidding', body: starter,
  };
  const title = original ? '编辑教程' : '新建教程';
  return `<nav class="breadcrumbs" aria-label="面包屑">
    <a href="#/manage">内容管理</a>${icon('chevron')}<span aria-current="page">${title}</span>
  </nav>
  <div class="page-heading">
    <span class="page-heading-icon warm">${icon('edit')}</span>
    <div><h1>${title}</h1><p>在正文中使用 Markdown，保存前可切换到预览。</p></div>
  </div>
  <form class="surface editor-form" id="editor-form">
    <fieldset class="editor-meta">
      <legend>教程信息</legend>
      <div class="field-grid">
        <label class="field"><span>教程标题</span>
          <input name="title" value="${escapeHTML(item.title)}" required maxlength="80" placeholder="例如：Shopee 商品活动报名">
        </label>
        <label class="field"><span>网址标识</span>
          <input name="id" value="${escapeHTML(item.id)}" ${original ? 'readonly' : 'pattern="[a-z0-9]+(-[a-z0-9]+)*"'} maxlength="64"
            placeholder="留空自动生成" title="小写英文字母、数字、连字符">
        </label>
        <label class="field"><span>平台</span>
          <select name="platform">${options(Object.entries(platforms).map(([key, value]) => [key, value.name]), item.platform)}</select>
        </label>
        <label class="field"><span>分类</span>
          <input name="category" value="${escapeHTML(item.category)}" required maxlength="24" placeholder="例如：营销活动">
        </label>
        <label class="field"><span>阅读时长（分钟）</span>
          <input name="minutes" type="number" min="1" max="180" value="${item.minutes}" required>
        </label>
        <label class="field"><span>难度</span>
          <select name="level">${options(['入门', '进阶', '综合'].map((level) => [level, level]), item.level)}</select>
        </label>
        <label class="field"><span>封面</span>
          <select name="cover">${options(Object.entries(covers), item.cover)}</select>
        </label>
        <label class="field"><span>更新日期</span>
          <input name="updatedAt" type="date" value="${item.updatedAt}" required>
        </label>
        <label class="field field-wide"><span>教程摘要</span>
          <textarea name="summary" rows="2" required maxlength="180" placeholder="简述教程解决的问题">${escapeHTML(item.summary)}</textarea>
        </label>
      </div>
    </fieldset>
    <section class="editor-content" aria-labelledby="editor-body-label">
      <div class="editor-header">
        <h2 id="editor-body-label">教程正文</h2>
        <div class="filters" role="group" aria-label="正文编辑模式">
          <button type="button" data-editor-tab="write" aria-pressed="true">编辑</button>
          <button type="button" data-editor-tab="preview" aria-pressed="false">预览</button>
        </div>
      </div>
      <div class="editor-write">
        <div class="editor-formatting" role="group" aria-label="插入内容格式">
          <button type="button" data-snippet="heading">章节</button>
          <button type="button" data-snippet="bold">加粗</button>
          <button type="button" data-snippet="list">列表</button>
          <button type="button" data-snippet="image">图片</button>
          <button type="button" data-snippet="checklist">检查表</button>
          <button type="button" data-snippet="steps">操作步骤</button>
          <button type="button" data-snippet="note">提示框</button>
        </div>
        <textarea name="body" class="markdown-input" aria-labelledby="editor-body-label"
          rows="17" maxlength="50000" spellcheck="false">${escapeHTML(item.body)}</textarea>
      </div>
      <div class="editor-preview" id="editor-preview" hidden></div>
      <details class="syntax-help">
        <summary>支持的 Markdown 写法</summary>
        <p>用 <code>## 章节</code> 生成目录，<code>### 小标题</code> 细分内容。支持列表、加粗、引用链接、图片、表格与代码块。用工具栏插入可勾选检查表或可展开操作步骤。</p>
        <p>截图可使用 HTTPS 图片链接，或将图片放入仓库并填写相对路径，例如 <code>content/images/example.png</code>。</p>
      </details>
    </section>
    <p class="form-error" id="editor-error" role="alert" hidden></p>
    <div class="editor-footer">
      <a class="button button-outline" href="#/manage">返回教程库</a>
      <button class="button button-primary" type="submit">${icon('check')} 保存教程</button>
    </div>
  </form>`;
}

export function bindEditor({ onChange, onSave }) {
  const form = document.querySelector('#editor-form');
  const body = form.elements.body;
  const preview = document.querySelector('#editor-preview');
  const write = form.querySelector('.editor-write');
  const errorMessage = document.querySelector('#editor-error');
  form.addEventListener('input', () => {
    errorMessage.hidden = true;
    onChange();
  });
  form.addEventListener('click', (event) => {
    const tab = event.target.closest('[data-editor-tab]');
    if (tab) {
      const isPreview = tab.dataset.editorTab === 'preview';
      for (const button of form.querySelectorAll('[data-editor-tab]')) {
        button.setAttribute('aria-pressed', button === tab);
      }
      write.hidden = isPreview;
      preview.hidden = !isPreview;
      if (isPreview) {
        preview.innerHTML = body.value.trim()
          ? parseSections(body.value).map((section) => renderSection(section, { readonly: true })).join('')
          : '<p class="muted">请先添加教程正文。</p>';
      }
    }
    const snippet = event.target.closest('[data-snippet]')?.dataset.snippet;
    if (snippet) {
      const start = body.selectionStart;
      const end = body.selectionEnd;
      const value = snippets[snippet];
      body.setRangeText(typeof value === 'function' ? value(body.value.slice(start, end)) : value, start, end, 'end');
      body.focus();
      errorMessage.hidden = true;
      onChange();
    }
  });
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    try {
      onSave(Object.fromEntries(new FormData(form)));
    } catch (error) {
      errorMessage.textContent = error.message;
      errorMessage.hidden = false;
    }
  });
}
