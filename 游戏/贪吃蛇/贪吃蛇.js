/**
 * 贪吃蛇游戏逻辑
 */
const SNAKE_STATE_KEY = 'snake-game-state';

const SnakeGame = {
	createApp(Vue, ElementPlus, ElementPlusIconsVue) {
		const { createApp } = Vue;

		const app = createApp({
			data() {
				const panelKey = 'snake-panels';
				const defaultPanels = { info: true, shortcuts: false };
				let saved;
				try { saved = JSON.parse(localStorage.getItem(panelKey) || 'null'); } catch (_) { saved = null; }
				return {
					speedLevel: 5,
					gridWidth: 20,
					gridHeight: 20,
					gridHeightOptions: Array.from({ length: 11 }, (_, i) => i + 10),
					gridWidthOptions: Array.from({ length: 11 }, (_, i) => i + 10),
					speedOptions: Array.from({ length: 10 }, (_, i) => i + 1),
					gameGridWidth: 20,
					gameGridHeight: 20,
					snake: [],
					food: {},
					direction: 'right',
					nextDirection: 'right',
					score: 0,
					highScore: localStorage.getItem('snake-high-score') || 0,
					gameOver: false,
					showGameOverModal: false,
					isPaused: true,
					gameInterval: null,
					panels: saved || defaultPanels,
					_panelKey: panelKey,
					_defaultPanels: { ...defaultPanels },
				};
			},
			computed: {
				gameSpeed() { return 250 - this.speedLevel * 20; },
				boardStyle() {
					return {
						'--board-cols': this.gameGridWidth,
						'--board-rows': this.gameGridHeight,
					};
				},
				cells() {
					const grid = [];
					for (let y = 0; y < this.gameGridHeight; y++) {
						for (let x = 0; x < this.gameGridWidth; x++) {
							const isSnakeHead = this.snake.length > 0 && this.snake[0].x === x && this.snake[0].y === y;
							const isSnakeBody = this.snake.slice(1).some(s => s.x === x && s.y === y);
							const isFood = this.food.x === x && this.food.y === y;
							let unit = null;
							if (isSnakeHead) unit = ['snake', 'head'];
							else if (isSnakeBody) unit = ['snake'];
							else if (isFood) unit = ['food'];
							grid.push({ x, y, unit });
						}
					}
					return grid;
				},
			},
			watch: {
				gameSpeed() {
					if (!this.isPaused && !this.gameOver) { this.startGameLoop(); }
				},
				score(newScore) {
					if (newScore > this.highScore) {
						this.highScore = newScore;
						localStorage.setItem('snake-high-score', newScore);
					}
				},
			},
			methods: {
				onPanelToggle(e) {
					const name = e.target.dataset.panel;
					this.panels[name] = e.target.open;
					try {
						if (JSON.stringify(this.panels) === JSON.stringify(this._defaultPanels)) {
							localStorage.removeItem(this._panelKey);
						} else {
							localStorage.setItem(this._panelKey, JSON.stringify(this.panels));
						}
					} catch (_) {}
				},
				saveGameState() {
					try {
						const state = {
							gameGridWidth: this.gameGridWidth,
							gameGridHeight: this.gameGridHeight,
							snake: this.snake,
							food: this.food,
							direction: this.direction,
							nextDirection: this.nextDirection,
							score: this.score,
							gameOver: this.gameOver,
							speedLevel: this.speedLevel,
						};
						localStorage.setItem(SNAKE_STATE_KEY, JSON.stringify(state));
					} catch (_) {}
				},
				loadGameState() {
					try {
						const saved = localStorage.getItem(SNAKE_STATE_KEY);
						if (!saved) return null;
						return JSON.parse(saved);
					} catch (_) { return null; }
				},
				clearGameState() {
					try { localStorage.removeItem(SNAKE_STATE_KEY); } catch (_) {}
				},
				restoreGameState(state) {
					this.gameGridWidth = state.gameGridWidth;
					this.gameGridHeight = state.gameGridHeight;
					this.gridWidth = state.gameGridWidth;
					this.gridHeight = state.gameGridHeight;
					this.snake = state.snake;
					this.food = state.food;
					this.direction = state.direction;
					this.nextDirection = state.nextDirection;
					this.score = state.score;
					this.gameOver = state.gameOver;
					this.speedLevel = state.speedLevel;
					this.isPaused = true;
				},
				initGame(clearSaved = true) {
					this.gameGridWidth = this.gridWidth;
					this.gameGridHeight = this.gridHeight;
					this.isPaused = true;
					this.gameOver = false;
					this.showGameOverModal = false;
					if (this.gameInterval) {
						clearInterval(this.gameInterval);
						this.gameInterval = null;
					}
					const startPosition = {
						x: Math.floor(this.gameGridWidth / 4),
						y: Math.floor(this.gameGridHeight / 2)
					};
					this.snake = [
						{ ...startPosition },
						{ x: startPosition.x - 1, y: startPosition.y },
						{ x: startPosition.x - 2, y: startPosition.y },
					];
					this.score = 0;
					this.direction = 'right';
					this.nextDirection = 'right';
					this.generateFood();
					this.saveGameState();
				},
				closeGameOverModal() { this.showGameOverModal = false; },
				closeGameOverAndNew() {
					this.showGameOverModal = false;
					this.initGame();
				},
				togglePause() {
					if (this.gameOver) {
						this.initGame(true);
						return;
					}
					this.isPaused = !this.isPaused;
					if (this.isPaused) {
						clearInterval(this.gameInterval);
						this.gameInterval = null;
						this.saveGameState();
					} else {
						this.startGameLoop();
					}
				},
				startGameLoop() {
					if (this.gameInterval) { clearInterval(this.gameInterval); }
					this.gameInterval = setInterval(this.gameLoop, this.gameSpeed);
				},
				gameLoop() {
					if (this.isPaused || this.gameOver) { return; }
					this.direction = this.nextDirection;
					const newHead = { x: this.snake[0].x, y: this.snake[0].y };
					switch (this.direction) {
						case 'up': newHead.y--; break;
						case 'down': newHead.y++; break;
						case 'left': newHead.x--; break;
						case 'right': newHead.x++; break;
					}
					if (newHead.x < 0 || newHead.x >= this.gameGridWidth ||
						newHead.y < 0 || newHead.y >= this.gameGridHeight ||
						this.snake.some(s => s.x === newHead.x && s.y === newHead.y)) {
						this.endGame();
						return;
					}
					this.snake.unshift(newHead);
					if (this.snake[0].x === this.food.x && this.snake[0].y === this.food.y) {
						this.score++;
						this.generateFood();
					} else {
						this.snake.pop();
					}
					this.saveGameState();
				},
				generateFood() {
					this.food = {
						x: Math.floor(Math.random() * this.gameGridWidth),
						y: Math.floor(Math.random() * this.gameGridHeight),
					};
					for (let i = 0; i < this.snake.length; i++) {
						if (this.snake[i].x === this.food.x && this.snake[i].y === this.food.y) {
							this.generateFood();
							return;
						}
					}
				},
				endGame() {
					this.gameOver = true;
					this.showGameOverModal = true;
					this.isPaused = true;
					clearInterval(this.gameInterval);
					this.gameInterval = null;
				},
				handleKeydown(e) {
					if (e.key === ' ') {
						e.preventDefault();
						if (Array.from(document.querySelectorAll('.el-overlay')).some(o => getComputedStyle(o).display !== 'none')) return;
						this.togglePause();
						return;
					}
					if (this.isPaused || this.gameOver) { return; }
					if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
						e.preventDefault();
					}
					switch (e.key) {
						case 'ArrowLeft':
							if (this.direction !== 'right') { this.nextDirection = 'left'; }
							break;
						case 'ArrowUp':
							if (this.direction !== 'down') { this.nextDirection = 'up'; }
							break;
						case 'ArrowRight':
							if (this.direction !== 'left') { this.nextDirection = 'right'; }
							break;
						case 'ArrowDown':
							if (this.direction !== 'up') { this.nextDirection = 'down'; }
							break;
					}
				},
			},
			mounted() {
				const savedState = this.loadGameState();
				if (savedState && !savedState.gameOver) {
					this.restoreGameState(savedState);
				} else {
					this.initGame(false);
				}
				window.addEventListener('keydown', this.handleKeydown);
			},
			beforeUnmount() {
				window.removeEventListener('keydown', this.handleKeydown);
				clearInterval(this.gameInterval);
			},
		});

		app.use(ElementPlus);
		for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
			app.component(key, component);
		}
		return app;
	},

	createHelpApp(Vue, ElementPlus, ElementPlusIconsVue) {
		const { createApp } = Vue;
		const help = createApp({
			data() {
				return {
					introVisible: !localStorage.getItem('intro-hidden-' + window.location.pathname),
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
				},
			},
		});
		help.use(ElementPlus);
		return help;
	},
};

// 导出供网页使用
if (typeof window !== 'undefined') {
	window.SnakeGame = SnakeGame;
}