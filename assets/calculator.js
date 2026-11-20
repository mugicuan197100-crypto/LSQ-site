import { loadLocal, saveLocal } from './catalog.js';
import { escapeHTML, icon } from './ui.js';

const example = {
  currency: 'THB',
  netPrice: '199',
  bidPrice: '149',
  purchase: '72',
  shipping: '22',
  reserve: '5',
  other: '3',
  commission: '8',
  fee: '3',
  ratio: '80',
};

function savedValues() {
  const saved = loadLocal('calculator', {});
  return Object.fromEntries(Object.entries(example).map(([field, value]) => [
    field, typeof saved?.[field] === 'string' ? saved[field] : value,
  ]));
}

function numberField(values, name, label, unit, { max = 1000000, min = 0, optional = false } = {}) {
  return `<label class="field">
    <span>${label}${optional ? '<small>（选填）</small>' : ''}</span>
    <span class="input-unit">
      <input name="${name}" type="number" inputmode="decimal" min="${min}" max="${max}" step="0.01"
        value="${escapeHTML(values[name])}"${optional ? '' : ' required'}>
      <span${unit === '%' ? '' : ' data-currency'}>${unit}</span>
    </span>
  </label>`;
}

export function renderCalculator() {
  const values = savedValues();
  const currency = values.currency === 'MYR' ? 'MYR' : 'THB';
  const field = (name, label, options) => numberField(values, name, label, currency, options);
  const percent = (name, label) => numberField(values, name, label, '%', { max: 100 });
  return `<div class="page-heading">
    <span class="page-heading-icon green">${icon('calculator')}</span>
    <div><h1>竞价计算器</h1><p>按每单实际成本测算保本价、参考出价区间和拟出价利润。</p></div>
  </div>
  <div class="calculator-layout">
    <form id="calculator-form" class="surface calc-form" novalidate>
      <div class="surface-heading">
        <h2>出价参数</h2>
        <button type="button" class="text-button" id="calculator-reset">${icon('refresh')} 恢复示例</button>
      </div>
      <fieldset>
        <legend>活动价格</legend>
        <div class="field-grid">
          <label class="field"><span>销售币种</span>
            <select name="currency"><option value="THB"${currency === 'THB' ? ' selected' : ''}>THB · 泰铢</option>
              <option value="MYR"${currency === 'MYR' ? ' selected' : ''}>MYR · 马来西亚令吉</option></select>
          </label>
          ${field('netPrice', '商品净价', { min: 0.01 })}
          ${field('bidPrice', '拟出价', { min: 0.01, optional: true })}
          ${percent('ratio', '参考上限占净价')}
        </div>
      </fieldset>
      <fieldset>
        <legend>每单固定成本</legend>
        <div class="field-grid">
          ${field('purchase', '采购成本')}
          ${field('shipping', '跨境运费')}
          ${field('reserve', '退货损耗预留')}
          ${field('other', '其它固定成本')}
        </div>
      </fieldset>
      <fieldset>
        <legend>按售价计提的费用</legend>
        <div class="field-grid">
          ${percent('commission', '平台佣金')}
          ${percent('fee', '交易手续费')}
        </div>
      </fieldset>
      <p class="form-error" id="calculator-error" role="status" hidden></p>
    </form>
    <aside class="calc-side" aria-label="测算结果">
      <section class="calc-results" id="calculator-results" aria-live="polite"></section>
      <section class="surface formula-card">
        <h2>计算口径</h2>
        <p><strong>保本价</strong> = 每单固定成本 ÷（1 − 佣金率 − 手续费率），向上取到分。</p>
        <p><strong>参考上限</strong> = 商品净价 × 参考比例。80% 是原 SOP 的内部参考，活动规则以卖家中心为准。</p>
        <p>金额需使用同一币种。费率基数或补贴与示例不同时，按实际结算校正。</p>
      </section>
      <a class="button button-outline calc-guide" href="#/tutorial/shopee-bidding">查看虾皮竞价 SOP ${icon('arrow')}</a>
    </aside>
  </div>`;
}

export function calculateBid(values) {
  const names = ['netPrice', 'bidPrice', 'purchase', 'shipping', 'reserve', 'other', 'commission', 'fee', 'ratio'];
  const cents = {};
  for (const name of names) {
    if (name === 'bidPrice' && values[name] === '') {
      cents[name] = null;
      continue;
    }
    if (!/^(?:\d+(?:\.\d{0,2})?|\.\d{1,2})$/.test(values[name])) {
      return { error: '请检查金额和比例，最多保留两位小数。' };
    }
    const percentage = ['commission', 'fee', 'ratio'].includes(name);
    const maximum = percentage ? 100 : 1000000;
    const minimum = name === 'netPrice' || name === 'bidPrice' ? 0.01 : 0;
    const number = Number(values[name]);
    if (number < minimum || number > maximum) return { error: '请检查金额和比例的范围。' };
    cents[name] = Math.round(number * 100);
  }
  const fees = cents.commission + cents.fee;
  if (fees >= 10000) return { error: '平台佣金与交易手续费的合计需小于 100%。' };
  const fixed = cents.purchase + cents.shipping + cents.reserve + cents.other;
  const minimum = Math.ceil((fixed * 10000) / (10000 - fees));
  const maximum = Math.floor((cents.netPrice * cents.ratio) / 10000);
  const profit = cents.bidPrice === null ? null : (cents.bidPrice * (10000 - fees)) / 10000 - fixed;
  return { minimum, maximum, fixed, fees, profit, bid: cents.bidPrice };
}

function renderResults(result, currency) {
  const money = (value) => new Intl.NumberFormat('zh-CN', {
    style: 'currency', currency, currencyDisplay: 'narrowSymbol', minimumFractionDigits: 2,
  }).format(value / 100);
  if (result.error) {
    return `<div class="result-hero">
      <span>${icon('target')} 保本最低价</span>
      <strong>—</strong><p>补充有效的出价参数后查看结果。</p>
    </div>`;
  }
  const { minimum, maximum, fixed, fees, profit, bid } = result;
  const lowestBid = Math.max(1, minimum);
  const range = maximum < lowestBid
    ? '参考上限低于最低可用出价'
    : `${money(lowestBid)} – ${money(maximum)}`;
  return `<div class="result-hero">
    <span>${icon('target')} 保本最低价</span>
    <strong>${money(minimum)}</strong>
    <p>每单成本 ${money(fixed)} <span aria-hidden="true">·</span> 费率合计 ${fees / 100}%</p>
  </div>
  <div class="result-details">
    <dl>
      <div><dt>参考出价区间</dt><dd>${range}</dd></div>
      <div><dt>拟出价的预计利润</dt>
        <dd class="${profit === null ? '' : profit < 0 ? 'result-negative' : 'result-positive'}">${profit === null ? '填写拟出价后显示' : money(profit)}</dd>
      </div>
    </dl>
    ${bid === null ? '' : `<p class="result-status ${bid < minimum ? 'result-negative' : bid > maximum ? 'result-note' : 'result-positive'}">
      ${icon(bid < minimum ? 'alert' : bid > maximum ? 'info' : 'circleCheck')}
      ${bid < minimum ? '拟出价低于保本价' : bid > maximum ? '拟出价高于参考上限' : '拟出价位于参考区间内'}
    </p>`}
  </div>`;
}

export function bindCalculator() {
  const form = document.querySelector('#calculator-form');
  const error = document.querySelector('#calculator-error');
  const results = document.querySelector('#calculator-results');
  function update(remember) {
    const values = Object.fromEntries(new FormData(form));
    const result = Array.from(form.elements).some((field) => field.validity?.badInput)
      ? { error: '请检查金额和比例的格式。' }
      : calculateBid(values);
    error.hidden = !result.error;
    error.textContent = result.error ?? '';
    for (const unit of form.querySelectorAll('[data-currency]')) unit.textContent = values.currency;
    results.innerHTML = renderResults(result, values.currency);
    if (remember) saveLocal('calculator', values);
  }
  form.addEventListener('submit', (event) => event.preventDefault());
  form.addEventListener('input', () => update(true));
  document.querySelector('#calculator-reset').addEventListener('click', () => {
    for (const [name, value] of Object.entries(example)) form.elements[name].value = value;
    update(true);
  });
  update(false);
}
