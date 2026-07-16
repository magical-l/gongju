const {
	createApp
} = Vue;

// ===== 字体相关 =====

/** 回退字体列表：queryLocalFonts 不可用时的预定义备用字体（优先符号覆盖广的） */
const FALLBACK_SYMBOL_FONTS = [
	'Noto Sans Symbols 2',
	'Segoe UI Symbol',
	'Segoe UI Emoji',
	'Arial Unicode MS',
	'Arial',
	'Microsoft Sans Serif',
	'Lucida Sans Unicode',
	'Consolas',
	'Courier New',
	'Microsoft YaHei',
	'DengXian',
	'SimSun-ExtB',
	'NSimSun',
	'Yu Gothic',
	'Meiryo',
	'Malgun Gothic',
	'Noto Sans CJK SC',
];

/**
 * 检测指定字体能否渲染指定字符（Canvas measureText 双重校验法）
 * 与 serif、monospace 两个 fallback 都不同 → 判为能渲染
 * 同时验证字体是否已安装 + 字符是否缺失（tofu）
 */
function canRender(char, fontName, cache) {
	const key = `${fontName}::${char}`;
	if (cache[key] !== undefined) return cache[key];

	const canvas = document.createElement('canvas');
	const ctx = canvas.getContext('2d');
	const size = 72;

	// 测两个 fallback 基准宽度
	ctx.font = `${size}px serif`;
	const wSerif = ctx.measureText(char).width;
	ctx.font = `${size}px monospace`;
	const wMono = ctx.measureText(char).width;
	const fallbackDiff = Math.abs(wSerif - wMono);

	// 测目标字体
	ctx.font = `${size}px "${fontName}", "${fontName}", serif`;
	const wTarget = ctx.measureText(char).width;

	const threshold = Math.max(1, fallbackDiff * 0.2);
	cache[key] = Math.abs(wTarget - wSerif) > threshold && Math.abs(wTarget - wMono) > threshold;
	return cache[key];
}

/** 枚举本机所有可用字体 */
async function enumerateFonts(fallbackList) {
	// 优先 queryLocalFonts（Chrome 103+，需用户手势触发权限）
	try {
		if ('queryLocalFonts' in navigator) {
			const raw = await navigator.queryLocalFonts();
			const families = [...new Set(raw.map(f => f.family))];
			return families.sort((a, b) => a.localeCompare(b));
		}
	} catch (e) {
		// 权限拒绝或 API 不可用，静默降级
	}

	// 回退：用预定义列表
	return fallbackList;
}

// 构建分类树结构
function buildCategoryTree() {
	return Object.entries(CATEGORIES).map(([name, children]) => ({
		name,
		children: children.length > 0
			? children.map(childName => ({ name: childName, children: [] }))
			: []
	}));
}

const app = createApp({
	data() {
		return {
			searchQuery: '',
			selectedCategory: '',
			hoveredSymbol: { ...SYMBOLS[0], _g: Object.keys(SYMBOLS[0].groups)[0] },
			previewFontSize: 2,

			// 字体切换
			fontList: [],
			selectedPreviewFont: '',
			fontAffectsAll: false,
		};
	},
	computed: {
		previewStyle() {
			const style = { fontSize: this.previewFontSize + 'rem' };
			if (this.selectedPreviewFont && this.fontAffectsAll) {
				style.fontFamily = `"${this.selectedPreviewFont}"`;
			}
			return style;
		},
		symbolStyle() {
			if (!this.selectedPreviewFont) return {};
			if (this.fontAffectsAll) return {}; // font 已通过 previewStyle 整行应用
			return { fontFamily: `"${this.selectedPreviewFont}"` };
		},
		categoryTree() {
			return buildCategoryTree();
		},
		groupedSymbols() {
			const result = {};
			for (const [cat, subs] of Object.entries(CATEGORIES)) {
				if (subs.length === 0) {
					const symbols = SYMBOLS.filter(s => s.groups[cat]).map(s => ({ ...s, _g: cat }));
					if (symbols.length > 0) {
						result[cat] = { symbols };
					}
				} else {
					const groups = [];
					for (const sub of subs) {
						const symbols = SYMBOLS.filter(s => s.groups[sub]).map(s => ({ ...s, _g: sub }));
						if (symbols.length > 0) {
							groups.push({ name: sub, symbols });
						}
					}
					const direct = SYMBOLS.filter(s => s.groups[cat] && !subs.some(sub => s.groups[sub])).map(s => ({ ...s, _g: cat }));
					result[cat] = {};
					if (groups.length > 0) result[cat].groups = groups;
					if (direct.length > 0) result[cat].symbols = direct;
				}
			}
			return result;
		},
		filteredSymbolGroups() {
			if (this.searchQuery) {
				return this._searchAll();
			}
			const selected = this.selectedCategory;
			if (!selected) return {};

			if (CATEGORIES[selected] !== undefined) {
				const data = this.groupedSymbols[selected];
				if (data) return { [selected]: data };
				return {};
			}

			const symbols = SYMBOLS.filter(s => s.groups[selected]).map(s => ({ ...s, _g: selected }));
			if (symbols.length > 0) {
				return { [selected]: { symbols } };
			}
			return {};
		},
	},
	methods: {
		_searchAll() {
			if (!this.searchQuery) return {};
			const query = this.searchQuery.toLowerCase();
			const result = {};
			for (const [cat, subs] of Object.entries(CATEGORIES)) {
				if (cat.toLowerCase().includes(query)) {
					result[cat] = this.groupedSymbols[cat];
					continue;
				}
				if (subs.length === 0) {
					const symbols = SYMBOLS.filter(s => {
						if (!s.groups[cat]) return false;
						return this._matchSymbol(s, query);
					}).map(s => ({ ...s, _g: cat }));
					if (symbols.length > 0) {
						result[cat] = { symbols };
					}
				} else {
					const matchedSubs = [];
					for (const sub of subs) {
						if (sub.toLowerCase().includes(query)) {
							const g = this.groupedSymbols[cat]?.groups?.find(x => x.name === sub);
							if (g) matchedSubs.push(g);
							continue;
						}
						const symbols = SYMBOLS.filter(s => {
							if (!s.groups[sub]) return false;
							return this._matchSymbol(s, query);
						}).map(s => ({ ...s, _g: sub }));
						if (symbols.length > 0) {
							matchedSubs.push({ name: sub, symbols });
						}
					}
					const directSymbols = SYMBOLS.filter(s => {
						if (!s.groups[cat] || subs.some(sub => s.groups[sub])) return false;
						return this._matchSymbol(s, query);
					}).map(s => ({ ...s, _g: cat }));
					result[cat] = {};
					if (matchedSubs.length > 0) result[cat].groups = matchedSubs;
					if (directSymbols.length > 0) result[cat].symbols = directSymbols;
					// 无匹配内容时移除该分类
					if (!Object.keys(result[cat]).length) {
						delete result[cat];
					}
				}
			}
			return result;
		},
		_matchSymbol(s, query) {
			const targets = [
				s.char.toLowerCase(),
				...Object.values(s.groups).flatMap(g => [g.name?.toLowerCase(), g.ename?.toLowerCase(), ...(g.alias || []).map(a => a.toLowerCase())].filter(Boolean)),
				...Object.keys(s.groups).map(k => k.toLowerCase())
			];
			return targets.some(t => t.includes(query));
		},
		selectCategory(name) {
			this.selectedCategory = name;
		},
		filteredItemCount(data) {
			if (!data) return 0;
			let count = 0;
			if (data.symbols) count += data.symbols.length;
			if (data.groups) for (const g of data.groups) count += g.symbols?.length || 0;
			return count;
		},
		clearHoveredSymbol() {
			// 始终显示详情卡片
		},
		setHoveredSymbol(symbol, groupName) {
			this.hoveredSymbol = { ...symbol, _g: groupName };
			this.adjustFontSize();
		},
		adjustFontSize() {
			this.$nextTick(() => {
				const rows = document.querySelectorAll('.symbol-preview .align-row');
				if (!rows.length) return;
				let maxRatio = 1;
				for (const row of rows) {
					if (row.scrollWidth > row.clientWidth) {
						maxRatio = Math.max(maxRatio, row.scrollWidth / row.clientWidth);
					}
				}
				let newSize = Math.round((this.previewFontSize / maxRatio) * 10) / 10;
				newSize = Math.max(0.9, Math.min(2, newSize));
				if (newSize !== this.previewFontSize) {
					this.previewFontSize = newSize;
				}
			});
		},

		// ===== 字体切换 =====

			/** 初始化字体列表（先加载回退列表，dropdown 打开时再尝试 queryLocalFonts） */
			async initFontList() {
				this.fontList = FALLBACK_SYMBOL_FONTS;
			},

			/** 在 dropdown 可见时：尝试 queryLocalFonts 获取全量字体列表 */
			async onFontDropdownVisible(visible) {
				if (!visible) return;
				try {
					const families = await enumerateFonts([]);
					if (families.length > 0) {
						const set = new Set([...this.fontList, ...families]);
						this.fontList = [...set].sort((a, b) => a.localeCompare(b));
					}
				} catch (e) {
					// 保持已有列表
				}
			},

			/** 获取字体的 style 对象，用于在选项内预览字符 */
			fontStyle(fontName) {
				return { fontFamily: `"${fontName}"` };
			},

		copySymbol(symbol) {
			const text = symbol.mode === 'dual' ? symbol.char + '️' : symbol.char;
			navigator.clipboard.writeText(text).then(() => {
				ElementPlus.ElMessage.success(`"${symbol.groups?.[symbol._g]?.name || symbol.char}"已复制`);
			}).catch(err => {
				ElementPlus.ElMessage.error('复制失败: ' + err);
			});
		},
		copyVariant(symbol, type) {
			if (symbol.mode !== 'dual') return;
			const vs = type === 'text' ? '︎' : '️';
			const text = symbol.char + vs;
			navigator.clipboard.writeText(text).then(() => {
				const label = type === 'text' ? '文本风格' : '表情风格';
				ElementPlus.ElMessage.success(`"${symbol.groups?.[symbol._g]?.name || symbol.char}"（${label}）已复制`);
			}).catch(err => {
				ElementPlus.ElMessage.error('复制失败: ' + err);
			});
		},
		copyCode(event) {
			const codeText = event.target.closest('.code').querySelector('.code-text').textContent;
			navigator.clipboard.writeText(codeText).then(() => {
				ElementPlus.ElMessage.success(`"${codeText}"已复制`);
			}).catch(err => {
				ElementPlus.ElMessage.error('复制失败: ' + err);
			});
		},
		symbolCount(groupName) {
			const data = this.groupedSymbols[groupName];
			if (!data) return 0;
			let count = 0;
			if (data.symbols) count += data.symbols.length;
			if (data.groups) for (const g of data.groups) count += g.symbols?.length || 0;
			return count;
		},
		autoFocusFirst() {
			const cats = Object.keys(this.filteredSymbolGroups);
			if (!cats.length) return;
			const data = this.filteredSymbolGroups[cats[0]];
			if (!data) return;
			let firstSymbol;
			if (data.symbols) {
				firstSymbol = data.symbols[0];
			} else if (data.groups && data.groups.length > 0) {
				firstSymbol = data.groups[0].symbols[0];
			}
			if (!firstSymbol) return;
			this.setHoveredSymbol(firstSymbol, firstSymbol._g);
			const chars = document.querySelectorAll('.symbol .char');
			for (const el of chars) {
				if (el.textContent.includes(firstSymbol.char)) {
					const symbolEl = el.closest('.symbol');
					if (symbolEl) {
						symbolEl.classList.add('auto-focused');
					}
					document.addEventListener('mouseover', function handler(e) {
						if (e.target.closest('.symbol')) {
							document.querySelectorAll('.symbol.auto-focused').forEach(s => s.classList.remove('auto-focused'));
							document.removeEventListener('mouseover', handler);
						}
					});
					el.scrollIntoView({
						behavior: 'smooth',
						block: 'center'
					});
					break;
				}
			}
		}
	},
	mounted() {
		const firstKey = Object.keys(CATEGORIES)[0];
		if (firstKey) {
			this.selectedCategory = firstKey;
		}
		this.initFontList();
		this.$nextTick(() => {
			this.autoFocusFirst();
			this.adjustFontSize();
		});
	},
	watch: {
		selectedCategory() {
			this.$nextTick(() => {
				this.autoFocusFirst();
			});
		},
		filteredSymbolGroups() {
			this.$nextTick(() => {
				this.autoFocusFirst();
			});
		}
	}
}).use(ElementPlus).mount('main>article');

const help = createApp({
	data() {
		return {
			introVisible: !localStorage.getItem('intro-hidden-' + window.location.pathname)
		};
	},
	watch: {
		introVisible(newValue) {
			const storageKey = 'intro-hidden-' + window.location.pathname;
			if (!newValue) {
				localStorage.setItem(storageKey, 'true');
			} else {
				localStorage.removeItem(storageKey);
			}
		}
	}
}).use(ElementPlus).mount('.help.area');
