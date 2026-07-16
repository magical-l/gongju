const {
	createApp
} = Vue;

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
		};
	},
	computed: {
		previewStyle() {
			return { fontSize: this.previewFontSize + 'rem' };
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
