/*
 * 子页顶部导航 —— 由 resources/tools.js 的工具清单渲染成分组下拉。
 *
 * 页面上只需要把原来那段 <nav> 换成：
 *   <nav class="site nav" data-root="../"></nav>
 *   <script src="../resources/site-nav.js" defer></script>
 *
 * data-root 是该页到站点根的相对前缀（根目录页为 ""，一级子目录为 "../"，二级为 "../../"）。
 *
 * 样式自带（注入 <style>）：各页加载的样式栈并不一致（游戏页走 @import ... layer()，
 * 工具页走 <link>），自带一份才能保证导航在每个页面长得一样。
 */
(function (root, doc) {
	'use strict';

	var CSS = `
nav.site.nav {
	flex-direction: row;
	gap: 0;
	align-items: center;
}
nav.site.nav .cat.item { position: relative; }

nav.site.nav summary.cat.name {
	list-style: none;
	cursor: pointer;
	padding: 4px 10px;
	border-radius: 5px;
	font-size: .875rem;
	font-weight: 500;
	color: #45455d;
	user-select: none;
	white-space: nowrap;
}
nav.site.nav summary.cat.name::-webkit-details-marker { display: none; }
nav.site.nav summary.cat.name::marker { content: ""; }

nav.site.nav summary.cat.name::after {
	content: "▾";
	margin-left: 6px;
	font-size: .625rem;
	opacity: .5;
}
nav.site.nav details[open] > summary.cat.name::after { content: "▴"; }

nav.site.nav summary.cat.name:hover { background: #f0eee7; color: #3f503b; }
nav.site.nav details.cat.item.active > summary.cat.name { color: #3f503b; font-weight: 600; }
nav.site.nav details.cat.item.active > summary.cat.name::before {
	content: "";
	display: inline-block;
	width: 6px;
	height: 6px;
	margin-right: 7px;
	border-radius: 50%;
	background: var(--cat-color, #5d7259);
	vertical-align: 1px;
}

nav.site.nav ul.tool.list {
	position: absolute;
	top: calc(100% + 4px);
	left: 0;
	z-index: 40;
	min-width: 12rem;
	margin: 0;
	padding: 5px;
	list-style: none;
	background: #fffefa;
	border: 1px solid #e2e2e4;
	border-radius: 8px;
	box-shadow: 0 6px 20px rgba(20, 22, 35, .13);
}
nav.site.nav a.tool.link {
	display: block;
	padding: 6px 10px;
	border-bottom: 0;
	border-radius: 5px;
	color: #141623;
	font-size: .875rem;
	font-weight: 400;
	white-space: nowrap;
}
nav.site.nav a.tool.link:hover { background: #f0eee7; color: #3f503b; border-bottom-color: transparent; }
nav.site.nav a.tool.link.active { color: #3f503b; font-weight: 600; background: #f0eee7; }

h1.website.name a.home.link { color: inherit; text-decoration: none; }
`;

	var COLORS = {
		'文本与编码': '#757cbb',
		'字符与图形': '#5d7259',
		'学科学习': '#8b7042',
		'游戏': '#995a7f'
	};

	function group(tools) {
		var order = [], byCat = {};
		tools.forEach(function (t) {
			if (!byCat[t.cat]) { byCat[t.cat] = []; order.push(t.cat); }
			byCat[t.cat].push(t);
		});
		return order.map(function (cat) { return { cat: cat, tools: byCat[cat] }; });
	}

	function render(nav) {
		var base = nav.getAttribute('data-root') || '';
		var here = decodeURIComponent(location.pathname).replace(/\\/g, '/');

		group(root.TOOLS).forEach(function (g) {
			var details = doc.createElement('details');
			details.className = 'cat item';
			details.style.setProperty('--cat-color', COLORS[g.cat] || '#5d7259');

			var summary = doc.createElement('summary');
			summary.className = 'cat name';
			summary.textContent = g.cat;
			details.appendChild(summary);

			var list = doc.createElement('ul');
			list.className = 'tool list';
			g.tools.forEach(function (t) {
				var li = doc.createElement('li');
				var a = doc.createElement('a');
				a.className = 'tool link';
				a.href = base + t.href;
				a.textContent = t.name;
				if (here.slice(-t.href.length) === t.href) {
					a.classList.add('active');
					details.classList.add('active');
				}
				li.appendChild(a);
				list.appendChild(li);
			});
			details.appendChild(list);
			nav.appendChild(details);
		});
	}

	function bind(nav) {
		nav.addEventListener('toggle', function (e) {
			var opened = e.target;
			if (opened.tagName !== 'DETAILS' || !opened.open) { return; }
			nav.querySelectorAll('details[open]').forEach(function (d) {
				if (d !== opened) { d.open = false; }
			});
		}, true);

		doc.addEventListener('click', function (e) {
			if (nav.contains(e.target)) { return; }
			nav.querySelectorAll('details[open]').forEach(function (d) { d.open = false; });
		});
		doc.addEventListener('keydown', function (e) {
			if (e.key !== 'Escape') { return; }
			nav.querySelectorAll('details[open]').forEach(function (d) { d.open = false; });
		});
	}

	function linkHome(base) {
		var h1 = doc.querySelector('h1.website.name');
		if (!h1 || h1.querySelector('a')) { return; }
		var a = doc.createElement('a');
		a.className = 'home link';
		a.href = base + 'index.html';
		while (h1.firstChild) { a.appendChild(h1.firstChild); }
		h1.appendChild(a);
	}

	function start() {
		var nav = doc.querySelector('nav.site.nav');
		if (!nav || !root.TOOLS) { return; }

		var style = doc.createElement('style');
		style.textContent = CSS;
		doc.head.appendChild(style);

		render(nav);
		bind(nav);
		linkHome(nav.getAttribute('data-root') || '');
	}

	if (doc.readyState === 'loading') {
		doc.addEventListener('DOMContentLoaded', start);
	} else {
		start();
	}
})(window, document);
