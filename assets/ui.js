const icons = {
  brand: '<path d="M5 7.5h14l1.2 12a1.6 1.6 0 0 1-1.6 1.8H5.4a1.6 1.6 0 0 1-1.6-1.8z"/><path d="M9 8V5a3 3 0 0 1 6 0v3M8 16l2.5-2.5 2 1.8L16 12"/>',
  layout: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M9 4v16"/>',
  home: '<path d="m3 10 9-7 9 7v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 21v-7h6v7"/>',
  book: '<path d="M4 19V5a2 2 0 0 1 2-2h13v18H6a2 2 0 0 1 0-4h13M8 7h7"/>',
  bag: '<path d="M5 7.5h14l1.2 12a1.6 1.6 0 0 1-1.6 1.8H5.4a1.6 1.6 0 0 1-1.6-1.8z"/><path d="M8.8 8V5.4a3.2 3.2 0 0 1 6.4 0V8"/><path d="M14 11.5c-.5-.4-1.3-.7-2.1-.7-1 0-1.7.5-1.7 1.2 0 1.9 3.7 1 3.7 3 0 .8-.8 1.4-1.9 1.4-.9 0-1.7-.3-2.3-.8"/>',
  music: '<path d="M14.5 3v12a4 4 0 1 1-4-4M14.5 3a6 6 0 0 0 6 6"/>',
  layers: '<path d="m12 3 9 5-9 5-9-5zm-9 9 9 5 9-5M3 16l9 5 9-5"/>',
  calculator: '<rect x="5" y="2.5" width="14" height="19" rx="2"/><path d="M8 6.5h8M9 11h.01M15 11h.01M9 15h.01M15 15h.01M9 18h.01M15 18h.01"/>',
  bookmark: '<path d="M6 5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16l-6-4-6 4z"/>',
  search: '<circle cx="10.8" cy="10.8" r="6.3"/><path d="m16 16 4.2 4.2"/>',
  edit: '<path d="M12 20H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h10m-6 9 8.4-8.4a2 2 0 0 1 2.8 2.8L12 16l-4 1z"/>',
  arrow: '<path d="M4.5 12h14.8m-6-6 6 6-6 6"/>',
  back: '<path d="M19.5 12H4.7m6-6-6 6 6 6"/>',
  chevron: '<path d="m9 6 6 6-6 6"/>',
  down: '<path d="m6 9 6 6 6-6"/>',
  clock: '<circle cx="12" cy="12" r="8.7"/><path d="M12 7v5l3 2"/>',
  calendar: '<rect x="3.5" y="5.5" width="17" height="15" rx="2"/><path d="M3.5 10h17M8 3.5v4M16 3.5v4"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  close: '<path d="m6 6 12 12M18 6 6 18"/>',
  circleCheck: '<circle cx="12" cy="12" r="9"/><path d="m8 12 2.7 2.7L16 9"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  copy: '<rect x="8" y="8" width="12.5" height="12.5" rx="2"/><path d="M15.5 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v8.5a2 2 0 0 0 2 2h3"/>',
  print: '<path d="M7 7V3h10v4M7 17H5a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2M7 14h10v7H7zM17 12h.01"/>',
  list: '<path d="M9 5.5h11m-11 6.5h11m-11 6.5h11M4 5.5h.01M4 12h.01M4 18.5h.01"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5m0-8h.01"/>',
  alert: '<path d="M10.3 4.7a2 2 0 0 1 3.4 0l7.4 12.6a2 2 0 0 1-1.7 3H4.6a2 2 0 0 1-1.7-3zM12 9v4m0 3h.01"/>',
  bulb: '<path d="M9 18h6m-5 3h4M8.8 16a6 6 0 1 1 6.4 0"/>',
  refresh: '<path d="M20 8a8.3 8.3 0 1 0 .4 6m0-11v5.5H15"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  upload: '<path d="M12 16V4m-5 5 5-5 5 5M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3"/>',
  download: '<path d="M12 4v12m-5-5 5 5 5-5M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3"/>',
  trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v5m4-5v5"/>',
  eye: '<path d="M2 12s3.4-6.5 10-6.5S22 12 22 12s-3.4 6.5-10 6.5S2 12 2 12z"/><circle cx="12" cy="12" r="2.5"/>',
  folder: '<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
  trending: '<path d="m3 17 6-6 4 4 8-8m-6 0h6v6"/>',
};

export const platforms = {
  shopee: { name: 'Shopee', icon: 'bag', description: '商品运营、活动报名与竞价策略', cover: 'bidding' },
  tiktok: { name: 'TikTok Shop', icon: 'music', description: '商品上架、短视频与直播运营', cover: 'video' },
  general: { name: '跨境通用', icon: 'layers', description: '成本测算与跨平台运营基础', cover: 'pricing' },
};

export const covers = {
  bidding: '橙色 · 店铺与价格标签',
  video: '蓝紫色 · 短视频',
  pricing: '薄荷绿 · 计算器',
  matching: '暖黄色 · 商品核对',
  catalog: '浅蓝色 · 商品上架',
  live: '淡粉色 · 直播设备',
};

export function icon(name, className = '') {
  return `<svg class="icon ${className}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name] ?? ''}</svg>`;
}

export function escapeHTML(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[char]);
}

export function tutorialHref(id, section) {
  const path = `#/tutorial/${id}`;
  return section ? `${path}?section=${encodeURIComponent(section)}` : path;
}

export function platformBadge(platform) {
  return `<span class="platform-badge ${platform}">${icon(platforms[platform].icon)}${platforms[platform].name}</span>`;
}

export function platformTile(platform) {
  return `<span class="platform-tile ${platform}" aria-hidden="true">${icon(platforms[platform].icon)}</span>`;
}

export function emptyState(symbol, title, message, action = '') {
  return `<div class="empty-state">
    <span class="empty-icon">${icon(symbol)}</span>
    <h2>${escapeHTML(title)}</h2>
    <p>${escapeHTML(message)}</p>${action}
  </div>`;
}
