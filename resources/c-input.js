/**
 * CInput 智能输入框组件 - 原生实现
 * 功能：自动/手动调整模式切换、拖拽调整、清空/重置按钮
 * 用法：<c-input v-model="text" resizable="yes" min-rows="2" initial-content="默认值" />
 */
const CInput = {
	name: 'CInput',
	template: `
		<div class="c-input-container" :class="{'resizing': isDragging, 'manual-mode': isManualMode}" ref="container">
			<div class="textarea-inner-container">
				<textarea ref="textarea"
					v-model="internalValue"
					:placeholder="placeholder"
					:disabled="disabled"
					:rows="computedRows"
					:style="textareaStyle"
					@mousedown="onMouseDown">
				</textarea>
				<div class="textarea-buttons">
					<button title="重置到初始内容" class="reset-button" v-if="showResetButton" @click="resetContent">↺</button>
					<button title="清空内容" class="clear-button" :disabled="isContentEmpty" @click="clearContent">×</button>
				</div>
			</div>
			<button :title="isManualMode ? '切换到自动' : '切换到手动'" v-if="showToggleButton"
				class="resize-mode-toggle" @click="toggleResizeMode"
				aria-label="切换调整模式" role="button" tabindex="0">
				<span class="toggle-icon">{{ isManualMode ? '🔒' : '🔄' }}</span>
			</button>
		</div>
	`,
	props: {
		modelValue: [String, Number],
		resizable: {
			type: String,
			default: 'yes',
			validator: value => ['yes', 'auto', 'manual', 'no'].includes(value)
		},
		minRows: {type: Number, default: 1},
		placeholder: {type: String, default: ''},
		disabled: {type: Boolean, default: false},
		initialContent: {type: [String, Number], default: ''}
	},
	data() {
		return {
			isDragging: false,
			manualHeight: null,
			manualWidth: null,
			hasBeenResized: false,
			initialValue: this.initialContent || this.modelValue || ''
		};
	},
	emits: ['update:modelValue'],
	computed: {
		showToggleButton() {
			return this.resizable === 'yes';
		},
		isManualMode() {
			return this.resizable === 'manual' || this.resizable === 'yes' && this.hasBeenResized;
		},
		isAutoResizeOn() {
			if (this.isDragging || this.isManualMode) {
				return false;
			}
			return this.resizable === 'auto' || this.resizable === 'yes';
		},
		computedRows() {
			// 手动模式下不设置rows，用style控制
			if (this.isManualMode) {
				return 1;
			}
			return this.minRows;
		},
		textareaStyle() {
			const style = {};
			// resize属性
			if (this.resizable === 'no' || this.resizable === 'auto') {
				style.resize = 'none';
			} else if (this.isManualMode) {
				style.resize = 'both';
			} else {
				style.resize = 'vertical'; // yes模式自动状态只允许垂直调整
			}
			// 手动模式的尺寸
			if (this.isManualMode && this.manualHeight) {
				style.height = `${this.manualHeight}px`;
				style.minHeight = `${this.manualHeight}px`;
				style.maxHeight = `${this.manualHeight}px`;
				style.overflowY = 'auto';
			}
			if (this.isManualMode && this.manualWidth) {
				style.width = `${this.manualWidth}px`;
				style.minWidth = `${this.manualWidth}px`;
				style.maxWidth = `${this.manualWidth}px`;
			}
			// 自动模式的最小高度
			if (!this.isManualMode && this.minRows > 0) {
				style.minHeight = `${this.minRows * 1.5}rem`;
			}
			return style;
		},
		internalValue: {
			get() {
				return this.modelValue || '';
			},
			set(newValue) {
				this.$emit('update:modelValue', newValue);
			}
		},
		showResetButton() {
			return this.initialValue !== '' && this.initialValue !== undefined;
		},
		isContentEmpty() {
			return this.internalValue === '';
		}
	},
	methods: {
		getTextareaDom() {
			return this.$refs.textarea;
		},
		getContainerDom() {
			return this.$refs.container;
		},
		adjustHeightForContent() {
			if (!this.isAutoResizeOn || !this.$refs.textarea) {
				return;
			}
			const textarea = this.$refs.textarea;
			textarea.style.height = 'auto';
			const newHeight = Math.max(textarea.scrollHeight, this.minRows * 24);
			textarea.style.height = `${newHeight}px`;
		},
		calMaxAvailableSpace() {
			const container = this.getContainerDom();
			if (!container) {
				return {height: null, width: null};
			}
			const parent = container.parentElement;
			if (!parent) {
				return {height: null, width: null};
			}
			const containerRect = container.getBoundingClientRect();
			const parentRect = parent.getBoundingClientRect();
			return {
				height: parentRect.height - (containerRect.top - parentRect.top),
				width: parentRect.width - (containerRect.left - parentRect.left)
			};
		},
		onMouseDown(event) {
			const canResize = this.resizable === 'yes' || this.resizable === 'manual';
			if (!canResize || !this.isInResizingRegion(event)) {
				return;
			}
			this.isDragging = true;
			const textarea = this.getTextareaDom();
			const container = this.getContainerDom();
			const startWidth = container.clientWidth;
			const startHeight = container.clientHeight;
			const startX = event.clientX;
			const startY = event.clientY;
			const maxSpace = this.calMaxAvailableSpace();
			const maxH = maxSpace.height || window.innerHeight;
			const maxW = maxSpace.width || window.innerWidth;
			// 锁定当前尺寸
			container.style.width = `${startWidth}px`;
			container.style.height = `${startHeight}px`;
			container.classList.add('resizing');
			textarea.style.overflow = 'hidden';
			const mouseMoveHandler = e => {
				if (!this.isDragging) {
					return;
				}
				const newW = Math.max(100, Math.min(startWidth + (e.clientX - startX), maxW));
				const newH = Math.max(32, Math.min(startHeight + (e.clientY - startY), maxH));
				container.style.width = `${newW}px`;
				container.style.height = `${newH}px`;
				this.manualWidth = newW;
				this.manualHeight = newH;
			};
			const mouseUpHandler = () => {
				this.isDragging = false;
				container.classList.remove('resizing');
				textarea.style.overflow = this.isManualMode ? 'auto' : 'hidden';
				window.removeEventListener('mousemove', mouseMoveHandler);
				window.removeEventListener('mouseup', mouseUpHandler);
				if (this.resizable === 'yes') {
					this.hasBeenResized = true;
				}
			};
			window.addEventListener('mousemove', mouseMoveHandler);
			window.addEventListener('mouseup', mouseUpHandler, {once: true});
		},
		isInResizingRegion(event) {
			const el = event.target;
			// 右下角16px区域为拖拽区
			return event.offsetY > el.clientHeight - 16 && event.offsetX > el.clientWidth - 16;
		},
		toggleResizeMode() {
			this.hasBeenResized = !this.hasBeenResized;
			if (!this.hasBeenResized) {
				this.manualHeight = null;
				this.manualWidth = null;
				const container = this.getContainerDom();
				const textarea = this.getTextareaDom();
				if (container) {
					container.style.width = '';
					container.style.height = '';
				}
				if (textarea) {
					textarea.style.width = '';
					textarea.style.height = '';
					textarea.style.minWidth = '';
					textarea.style.maxWidth = '';
					textarea.style.minHeight = '';
					textarea.style.maxHeight = '';
				}
				this.$nextTick(() => this.adjustHeightForContent());
			}
		},
		clearContent() {
			this.internalValue = '';
		},
		resetContent() {
			this.internalValue = this.initialValue;
		}
	},
	watch: {
		resizable(newVal) {
			this.manualHeight = null;
			this.manualWidth = null;
			this.isDragging = false;
			this.hasBeenResized = false;
			if (newVal === 'manual') {
				this.$nextTick(() => {
					const textarea = this.getTextareaDom();
					if (textarea) {
						this.manualHeight = textarea.scrollHeight;
						this.manualWidth = textarea.clientWidth;
						this.hasBeenResized = true;
					}
				});
			}
		},
		internalValue() {
			if (this.isAutoResizeOn) {
				this.$nextTick(() => this.adjustHeightForContent());
			}
		},
		initialContent(newVal) {
			this.initialValue = newVal;
		}
	},
	mounted() {
		if (this.isAutoResizeOn) {
			this.$nextTick(() => this.adjustHeightForContent());
		}
		if (this.resizable === 'manual') {
			this.$nextTick(() => {
				const textarea = this.getTextareaDom();
				if (textarea) {
					this.manualHeight = textarea.scrollHeight;
					this.hasBeenResized = true;
				}
			});
		}
	}
};

// 组件样式
const cInputStyles = `
.c-input-container {
	position: relative;
	display: inline-block;
	box-sizing: border-box;
	width: 100%;
	max-height: 100%;
	min-height: 2.5rem;
}

.c-input-container .textarea-inner-container {
	position: relative;
	width: 100%;
	height: 100%;
}

.c-input-container textarea {
	box-sizing: border-box;
	width: calc(100% - 36px);
	min-width: 100px;
	min-height: 2.5em;
	padding: 0.5rem 70px 0.5rem 0.5rem;
	border: 1px solid var(--el-border-color, #dcdfe6);
	border-radius: var(--el-border-radius-base, 4px);
	font-size: inherit;
	font-family: inherit;
	line-height: 1.5;
	background: var(--el-fill-color-blank, #fff);
	color: var(--el-text-color-regular, #606266);
	outline: none;
	transition: border-color 0.2s;
}

.c-input-container textarea:focus {
	border-color: var(--el-color-primary, #409eff);
}

.c-input-container textarea:disabled {
	background: var(--el-disabled-bg-color, #f5f7fa);
	color: var(--el-disabled-text-color, #c0c4cc);
	cursor: not-allowed;
}

.c-input-container.resizing textarea {
	overflow: hidden !important;
	pointer-events: none !important;
	transition: none !important;
}

.c-input-container.manual-mode textarea {
	position: absolute;
	top: 0;
	left: 0;
	right: 36px;
	bottom: 0;
	width: auto !important;
	height: auto !important;
}

/* 内容操作按钮 */
.c-input-container .textarea-buttons {
	position: absolute;
	top: 0.5rem;
	right: 2.5rem;
	display: flex;
	gap: 5px;
}

.c-input-container .reset-button,
.c-input-container .clear-button {
	border: none;
	border-radius: 3px;
	width: 24px;
	height: 24px;
	background: rgba(255, 255, 255, 0.7);
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 1.1rem;
	cursor: pointer;
	color: var(--el-text-color-regular, #606266);
}

.c-input-container .reset-button:hover,
.c-input-container .clear-button:hover {
	background: #f0f0f0;
}

.c-input-container .clear-button:disabled {
	opacity: 0.5;
	cursor: not-allowed;
}

/* 模式切换按钮 */
.c-input-container .resize-mode-toggle {
	position: absolute;
	top: 0.5rem;
	right: 0.5rem;
	z-index: 10;
	border: none;
	border-radius: 3px;
	padding: 0;
	width: 28px;
	height: 24px;
	background: rgba(255, 255, 255, 0.7);
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 1rem;
	cursor: pointer;
}

.c-input-container .resize-mode-toggle:hover {
	background: #f0f0f0;
}

.c-input-container .toggle-icon {
	font-size: 0.9rem;
}
`;

const CInputPlugin = {
	install(app) {
		if (typeof document !== 'undefined') {
			const styleId = 'c-input-styles';
			if (!document.getElementById(styleId)) {
				const style = document.createElement('style');
				style.id = styleId;
				style.textContent = cInputStyles;
				document.head.appendChild(style);
			}
		}
		app.component('c-input', CInput);
	}
};

if (typeof window !== 'undefined') {
	window.CInput = CInput;
	window.CInputPlugin = CInputPlugin;
}