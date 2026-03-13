/**
 * 公用调试工具：布局链导出、样式表审计、指定根节点及其子节点/祖先的 DOM+计算样式导出。
 * 通用方法挂到 window：__debugExportLayoutChain__、__debugAuditStylesheet__、__debugExportSelectAndCss__。
 * 2048 页引入本脚本即可用，无需页面再写封装：__2048ExportLayoutChain__、__2048AuditCss__、__2048ExportSelectDomAndCss__。
 */
(function () {
  'use strict';

  /**
   * 导出一条“元素链”上各节点的关键 CSS 计算值。
   * @param {Array<{ selector?: string, el?: Element, label: string }>} chain - 每项为 selector（用 querySelector）或 el，及 label
   * @param {string[]} props - 要导出的 CSS 属性名（如 'height', 'overflow-y'）
   * @param {Object} options - { title?: string, extraLine?: (el) => string }
   * @returns {string}
   */
  function exportLayoutChain(chain, props, options) {
    const title = (options && options.title) || '--- exportLayoutChain ---';
    const lines = [title, ''];
    const extraLine = options && options.extraLine;

    function one(entry) {
      if (!entry || (!entry.el && !entry.selector)) {
        lines.push((entry && entry.label) ? entry.label + ': 未找到' : '未找到');
        return;
      }
      const el = entry.el || (entry.selector ? document.querySelector(entry.selector) : null);
      if (!el) {
        lines.push(entry.label + ': 未找到');
        return;
      }
      const cs = window.getComputedStyle(el);
      const tag = (el.tagName || '').toLowerCase();
      const id = el.id ? '#' + el.id : '';
      const cls = (el.className && typeof el.className === 'string') ? el.className.split(/\s+/).slice(0, 5).join('.') : '';
      lines.push(entry.label + '  ' + tag + id + (cls ? '.' + cls : ''));
      for (let i = 0; i < props.length; i++) {
        const p = props[i];
        const v = cs.getPropertyValue(p);
        if (v) lines.push('  ' + p + ': ' + v);
      }
      lines.push('  offsetHeight: ' + el.offsetHeight + '; clientHeight: ' + el.clientHeight + '; scrollHeight: ' + el.scrollHeight);
      if (el.getBoundingClientRect) {
        const r = el.getBoundingClientRect();
        lines.push('  getBoundingClientRect().height: ' + r.height.toFixed(2));
      }
      if (typeof extraLine === 'function') {
        const extra = extraLine(el);
        if (extra) lines.push('  ' + extra);
      }
      lines.push('');
    }

    for (let j = 0; j < chain.length; j++) {
      const entry = chain[j];
      if (entry.selector && !entry.el) entry.el = document.querySelector(entry.selector);
      one(entry);
    }
    return lines.join('\n');
  }

  /**
   * 审计某样式表中匹配 selectorFilter 的规则：对每条规则取第一个匹配元素，对比规则值与计算值。
   * @param {string|number} sheetMatch - 样式表 href 包含的字符串，或样式表索引
   * @param {RegExp} selectorFilter - 选择器需匹配的正则
   * @param {Object} options - { title?: string }
   * @returns {string}
   */
  function auditStylesheet(sheetMatch, selectorFilter, options) {
    const sheets = Array.prototype.slice.call(document.styleSheets || []);
    let sheet;
    if (typeof sheetMatch === 'number') {
      sheet = sheets[sheetMatch];
    } else {
      sheet = sheets.filter(function (s) {
        try { return s.href && s.href.indexOf(String(sheetMatch)) !== -1; } catch (e) { return false; }
      })[0];
    }
    if (!sheet) return '未找到样式表: ' + sheetMatch;
    let rules = [];
    try {
      const list = sheet.cssRules || sheet.rules || [];
      for (let i = 0; i < list.length; i++) rules.push(list[i]);
    } catch (e) {
      return '无法读取规则（可能跨域）: ' + (e && e.message);
    }
    function camelToKebab(s) { return s.replace(/([A-Z])/g, '-$1').toLowerCase(); }
    function norm(v) { if (typeof v !== 'string') return ''; return v.trim(); }
    const title = (options && options.title) || '--- auditStylesheet ---';
    const lines = [title, '格式: 属性 规则值→计算值 [✓/✗]', ''];

    for (let r = 0; r < rules.length; r++) {
      const rule = rules[r];
      if (rule.type !== 1) continue;
      const sel = rule.selectorText;
      if (!sel || !rule.style || !rule.style.length || !selectorFilter.test(sel)) continue;
      let elList = [];
      try { elList = document.querySelectorAll(sel); } catch (err) {
        lines.push('[' + r + '] ' + sel + ' (选择器异常)');
        lines.push('');
        continue;
      }
      const n = elList.length;
      lines.push('[' + r + '] ' + sel + '  匹配: ' + n);
      if (n === 0) { lines.push('  (无匹配)', ''); continue; }
      const el = elList[0];
      const computed = window.getComputedStyle(el);
      for (let p = 0; p < rule.style.length; p++) {
        const prop = rule.style[p];
        const ruleVal = norm(rule.style.getPropertyValue(prop));
        const kebab = camelToKebab(prop);
        const compVal = norm(computed.getPropertyValue(kebab));
        const same = ruleVal === compVal ? '✓' : '✗';
        lines.push('  ' + prop + ' ' + ruleVal + '→' + compVal + ' [' + same + ']');
      }
      lines.push('');
    }
    return lines.join('\n');
  }

  /**
   * 从 rootSelector 或 options.rootElement 得到根节点，导出其自身、若干子节点及祖先链的 DOM+计算样式。
   * @param {string} [rootSelector] - 根节点选择器（当未提供 options.rootElement 时使用）
   * @param {Object} options - { rootElement?: Element, childSelectors?: Array<{ selector, label }>, props?: string[], ancestorStop?: string | (el: Element) => boolean, title?: string }
   * @returns {string}
   */
  function exportSelectAndCss(rootSelector, options) {
    const root = (options && options.rootElement) || (rootSelector ? document.querySelector(rootSelector) : null);
    if (!root) return '未找到: ' + (rootSelector || 'rootElement');
    const props = (options && options.props) || ['width', 'min-width', 'max-width', 'display', 'flex', 'flex-grow', 'flex-shrink', 'flex-basis'];
    const title = (options && options.title) || '--- exportSelectAndCss ---';
    const lines = [title];
    const ancestorStop = options && options.ancestorStop;

    function one(el, label) {
      if (!el) return;
      const cs = window.getComputedStyle(el);
      const cls = (el.className && typeof el.className === 'string') ? el.className.split(/\s+/).slice(0, 4).join('.') : '';
      const tag = (el.tagName || '').toLowerCase();
      lines.push(label + ' ' + tag + (cls ? '.' + cls : ''));
      lines.push('  ' + props.map(function (p) { return p + ':' + cs.getPropertyValue(p); }).join('; '));
      lines.push('  offsetWidth: ' + el.offsetWidth + '; getBoundingClientRect().width: ' + (el.getBoundingClientRect && el.getBoundingClientRect().width.toFixed(2)));
    }

    const childSelectors = options && options.childSelectors;
    if (childSelectors && childSelectors.length) {
      for (let i = 0; i < childSelectors.length; i++) {
        const c = childSelectors[i];
        const el = root.querySelector(c.selector);
        lines.push('--- ' + (c.label || c.selector) + ' ---');
        one(el, c.label || '');
      }
    }

    lines.push('--- 祖先链 [0]=root 向上 ---');
    one(root, '[0]');
    let el = root.parentElement;
    for (let i = 1; el && i < 20; i++, el = el.parentElement) {
      one(el, '[' + i + ']');
      if (typeof ancestorStop === 'function' && ancestorStop(el)) break;
      if (typeof ancestorStop === 'string' && el.matches && el.matches(ancestorStop)) break;
      if (el.classList && el.tagName === 'BODY') break;
    }
    const out = lines.join('\n');
    return out;
  }

  if (typeof window !== 'undefined') {
    window.__debugExportLayoutChain__ = exportLayoutChain;
    window.__debugAuditStylesheet__ = auditStylesheet;
    window.__debugExportSelectAndCss__ = exportSelectAndCss;

    /** 2048 页专用：引入本脚本即可用，无需页面再写薄封装 */
    window.__2048ExportLayoutChain__ = function () {
      const board = document.getElementById('board');
      const chain = [
        { el: document.body, label: 'body' },
        { selector: 'body.grid.反叵字形 main', label: 'main.scrollable' },
        { selector: 'article.gaming.area', label: 'article.gaming.area' },
        { selector: '.main.map.area', label: '.main.map.area' },
        { selector: '#board-wrap', label: '#board-wrap' },
        { selector: '#board', label: '#board' },
        { el: board ? board.querySelector('.cell') : null, label: '.cell 首个' }
      ];
      const props = ['height', 'min-height', 'max-height', 'overflow', 'overflow-y', 'display', 'flex-direction', 'flex-shrink', 'flex-grow', 'grid-template-rows'];
      const main = document.querySelector('body.grid.反叵字形 main');
      let out = exportLayoutChain(chain, props, {
        title: '--- __2048ExportLayoutChain__ ---',
        extraLine: function (el) {
          if (el === main) return 'clientHeight: ' + el.clientHeight + '; scrollHeight: ' + el.scrollHeight + '; overflow-y: ' + window.getComputedStyle(el).getPropertyValue('overflow-y');
          return '';
        }
      });
      out += '\n--- 若 main.scrollable 的 scrollHeight > clientHeight 才应有滚动条 ---\n';
      if (main) out += 'main clientHeight: ' + main.clientHeight + ', scrollHeight: ' + main.scrollHeight + ', overflow-y: ' + window.getComputedStyle(main).getPropertyValue('overflow-y') + '\n';
      console.log(out);
      return out;
    };

    window.__2048AuditCss__ = function () {
      const out = auditStylesheet('2048.css', /\.gaming\.area|\.toolbar|\.el-select__prefix|\.按压式/, { title: '--- __2048AuditCss__ 仅“我们加的”规则 ---' });
      console.log(out);
      return out;
    };

    (function () {
      const prefixEl = document.querySelector('.el-select .el-select__prefix');
      const root = prefixEl ? prefixEl.closest('.el-select') : null;
      if (!root) {
        window.__2048ExportSelectDomAndCss__ = function () { console.log('未找到带 prefix 的 .el-select'); };
        return;
      }
      window.__2048ExportSelectDomAndCss__ = function () {
        let out = exportSelectAndCss(null, {
          rootElement: root,
          childSelectors: [
            { selector: '.el-select__wrapper', label: '[0w] wrapper' },
            { selector: '.el-select__selection', label: '[0s] selection' },
            { selector: '.el-select__placeholder', label: '[0s-placeholder] placeholder' }
          ],
          ancestorStop: function (el) { return el.classList && (el.classList.contains('toolbar') || el.tagName === 'BODY'); },
          title: '--- __2048ExportSelectDomAndCss__ ---'
        });
        const wrapper = root.querySelector('.el-select__wrapper');
        const sel = root.querySelector('.el-select__selection');
        const prefix = root.querySelector('.el-select__prefix');
        const suffix = root.querySelector('.el-select__suffix');
        if (wrapper && sel) {
          const cw = window.getComputedStyle(wrapper);
          const gap = parseFloat(cw.getPropertyValue('gap')) || 0;
          const pl = parseFloat(cw.getPropertyValue('padding-left')) || 0;
          const pr = parseFloat(cw.getPropertyValue('padding-right')) || 0;
          const W = wrapper.offsetWidth;
          const P = prefix ? prefix.offsetWidth : 0;
          const S = suffix ? suffix.offsetWidth : 0;
          const Sel = sel.offsetWidth;
          const remaining = W - P - S - 2 * gap - pl - pr;
          out += '\n--- 验证：wrapper 内分配 ---\nwrapper.offsetWidth=' + W + ', prefix=' + P + ', suffix=' + S + ', selection.offsetWidth=' + Sel + ', gap=' + gap + ', paddingLeft=' + pl + ', paddingRight=' + pr + '\n若 selection 宽度由“剩余空间”分配，则 selection ≈ ' + remaining.toFixed(0) + 'px。若 Sel=' + Sel + ' 接近此值，则原因确定。\n';
        }
        const placeholder = sel ? sel.querySelector('.el-select__placeholder') : null;
        if (placeholder && sel) out += '\n--- placeholder vs selection 宽度 ---\nplaceholder.offsetWidth=' + placeholder.offsetWidth + ', selection.offsetWidth=' + sel.offsetWidth + '\n';
        console.log(out);
        return out;
      };
    })();
  }
})();
