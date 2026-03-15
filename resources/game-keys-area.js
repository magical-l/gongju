/**
 * 游戏按键区域：仅当按键目标在 .gaming.area 内且不在输入框内时，才应响应游戏方向键/空格等。
 * 用法：在 keydown 里先执行 if (!window.GameKeysArea || !window.GameKeysArea.shouldHandle(e)) return;
 */
(function () {
  'use strict';
  function isEditable(el) {
    if (!el || !el.tagName) return false;
    var tag = el.tagName.toUpperCase();
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
    if (el.isContentEditable === true || el.isContentEditable === 'true') return true;
    return false;
  }
  function shouldHandle(event) {
    var area = document.querySelector('.gaming.area');
    if (!area || !event.target || !area.contains(event.target)) return false;
    if (isEditable(event.target)) return false;
    return true;
  }
  window.GameKeysArea = { shouldHandle: shouldHandle };
})();
