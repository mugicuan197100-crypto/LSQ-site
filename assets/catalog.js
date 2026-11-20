import { covers, platforms } from './ui.js';

export const MAX_TUTORIALS = 250;
export const MAX_IMPORT_BYTES = 8 * 1024 * 1024;
const STORAGE_PREFIX = 'lsq-commerce:';
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const LEVELS = ['入门', '进阶', '综合'];

function requiredText(value, label, maxLength) {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`请填写${label}。`);
  if (value.trim().length > maxLength) throw new Error(`${label}最多 ${maxLength} 字。`);
  return value.trim();
}

export function today() {
  return new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Shanghai' });
}

export function validateTutorial(item) {
  if (!item || typeof item !== 'object') throw new Error('教程格式无效。');
  const id = requiredText(item.id, '教程网址标识', 64);
  if (!SLUG.test(id)) throw new Error('网址标识使用小写英文字母、数字和连字符。');
  if (typeof item.platform !== 'string' || !Object.hasOwn(platforms, item.platform)) throw new Error('请选择有效的平台。');
  if (typeof item.cover !== 'string' || !Object.hasOwn(covers, item.cover)) throw new Error('请选择封面。');
  if (!LEVELS.includes(item.level)) throw new Error('请选择有效的难度。');
  if (!Number.isInteger(item.minutes) || item.minutes < 1 || item.minutes > 180) {
    throw new Error('阅读时长需为 1–180 之间的整数。');
  }
  const date = item.updatedAt;
  const parsed = new Date(`${date}T00:00:00Z`);
  if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)
      || Number.isNaN(parsed.valueOf()) || parsed.toISOString().slice(0, 10) !== date) {
    throw new Error('更新日期需要是有效的 YYYY-MM-DD 日期。');
  }
  return {
    id,
    title: requiredText(item.title, '教程标题', 80),
    platform: item.platform,
    category: requiredText(item.category, '分类名称', 24),
    summary: requiredText(item.summary, '教程摘要', 180),
    minutes: item.minutes,
    level: item.level,
    updatedAt: date,
    cover: item.cover,
    body: requiredText(item.body, '教程正文', 50000),
  };
}

export function validateCatalog(file) {
  if (file?.version !== 1 || !Array.isArray(file.tutorials) || file.tutorials.length > MAX_TUTORIALS) {
    throw new Error(`需要版本为 1 的教程库 JSON，最多包含 ${MAX_TUTORIALS} 篇教程。`);
  }
  const ids = new Set();
  return file.tutorials.map((item, index) => {
    try {
      const tutorial = validateTutorial(item);
      if (ids.has(tutorial.id)) throw new Error(`网址标识重复：${tutorial.id}。`);
      ids.add(tutorial.id);
      return tutorial;
    } catch (error) {
      throw new Error(`第 ${index + 1} 篇教程：${error.message}`);
    }
  });
}

export function loadLocal(key, fallback) {
  try {
    const value = localStorage.getItem(STORAGE_PREFIX + key);
    return value === null ? fallback : JSON.parse(value);
  } catch {
    return fallback;
  }
}

export function saveLocal(key, value) {
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function readDrafts() {
  const fallback = { upserts: [], removed: [], order: [] };
  const data = loadLocal('drafts', fallback);
  try {
    return {
      upserts: validateCatalog({ version: 1, tutorials: data.upserts }),
      removed: Array.isArray(data.removed) ? data.removed.filter((id) => typeof id === 'string' && SLUG.test(id)) : [],
      order: Array.isArray(data.order) ? data.order.filter((id) => typeof id === 'string' && SLUG.test(id)) : [],
    };
  } catch {
    return fallback;
  }
}

export function applyDrafts(base, drafts) {
  const catalog = new Map(base.map((item) => [item.id, item]));
  for (const id of drafts.removed) catalog.delete(id);
  for (const tutorial of drafts.upserts) catalog.set(tutorial.id, tutorial);
  const order = new Set([...drafts.order, ...catalog.keys()]);
  return [...order].filter((id) => catalog.has(id)).map((id) => catalog.get(id));
}

export function makeImportDrafts(base, imported) {
  const byId = new Map(base.map((tutorial) => [tutorial.id, tutorial]));
  const ids = new Set(imported.map(({ id }) => id));
  return {
    upserts: imported.filter((tutorial) => JSON.stringify(tutorial) !== JSON.stringify(byId.get(tutorial.id))),
    removed: base.filter(({ id }) => !ids.has(id)).map(({ id }) => id),
    order: imported.map(({ id }) => id),
  };
}

function normalize(text) {
  return text.normalize('NFKC').toLocaleLowerCase();
}

export function searchTutorials(tutorials, query) {
  const words = normalize(query).trim().split(/\s+/).filter(Boolean);
  if (!words.length) return tutorials;
  return tutorials.flatMap((item) => {
    const title = normalize(item.title);
    const info = normalize(`${item.summary} ${item.category} ${platforms[item.platform].name}`);
    const body = normalize(item.body);
    const weights = words.map((word) => title.includes(word) ? 6 : info.includes(word) ? 3 : body.includes(word) ? 1 : 0);
    return weights.includes(0) ? [] : [{ item, score: weights.reduce((sum, weight) => sum + weight, 0) }];
  }).sort((a, b) => b.score - a.score).map(({ item }) => item);
}
