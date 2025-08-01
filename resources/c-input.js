const CInput = {
	name: 'CInput',
	template: `
		<div class="c-input-container" :class="{'resizing': isDragging}" ref="container">
			<div class="textarea-inner-container">
				<p-textarea v-model="internalValue" ref="textarea"
									:placeholder="placeholder"
									:size="size" :variant="variant" :disabled="disabled"
									:invalid="invalid"
									:rows="minRows" :auto-resize="isAutoResizeOn"
									:class="{'manual-resize': hasBeenResized}"
									:style="textareaStyle"
									@mousedown="onMouseDown">
				</p-textarea>
				<div class="textarea-buttons">
					<button title="重置到初始内容" class="reset-button" v-if="showResetButton" @click="resetContent">↺</button>
					<button title="清空内容" class="clear-button" :disabled="isContentEmpty" @click="clearContent">×</button>
				</div>
			</div>
			<span :title="isUnderManual ? '切换到自动' : '切换到手动'" v-if="showToggleButton"
						class="resize-mode-toggle" @click="toggleResizeMode"
						aria-label="isUnderManual ? '切换到自动' : '切换到手动'" role="button" tabindex="0">
				<i class="left pi pi-arrows-v">
					<i class="right pi" :class="isUnderManual?'pi-lock':'pi-lock-open'"></i>
				</i>
			</span>
		</div>
	`,
	components: {
		'p-textarea': PrimeVue ? PrimeVue.Textarea : {}
	},
	props: {
		modelValue: [String, Number],
		resizable: {
			type: String,
			default: 'yes',
			validator: value => ['yes', 'auto', 'manual', 'no'].includes(value)
		},
		minRows: {type: Number, default: 1},
		//primevue原生
		size: {type: String, default: null},
		variant: {type: String, default: 'outlined'},
		invalid: {type: Boolean, default: false},
		//html原生
		placeholder: {type: String, default: ''},
		disabled: {type: Boolean, default: false},
		//初始内容
		initialContent: {type: [String, Number], default: ''}
	},
	data() {
		return {
			isDragging: false,
			manualHeight: null,
			hasBeenResized: false,
			// 存储初始内容副本
			initialValue: this.modelValue || ''
		};
	},
	emits: ['update:modelValue'],
	computed: {
		showToggleButton() {
			return this.resizable === 'yes';
		},
		isUnderManual() {
			return this.resizable === 'manual' || this.resizable === 'yes' && this.hasBeenResized;
		},
		isAutoResizeOn() {
			// 禁用情况：拖拽中 | yes模式已调整 | 非自动调整模式
			if (this.isDragging) {
				return false;
			}
			return this.resizable === 'auto' || this.resizable === 'yes' && !this.hasBeenResized;
		},
		textareaStyle() {
			const style = {
				resize: this.resizable === 'yes' || this.resizable === 'manual' ? 'both' : 'none'
			};
			// 自动模式下的最小高度
			if (!this.hasBeenResized && this.minRows > 0) {
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
		canManualResize() {
			return this.resizable === 'manual' || this.resizable === 'yes';
		},
		showResetButton() {
			return this.initialValue !== '';
		},
		isContentEmpty() {
			return this.internalValue === '';
		}
	},
	methods: {
		getTextareaDom() {
			return this.$refs.textarea?.$el;
		},
		getContainerDom() {
			return this.$refs.container;
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
			if (!this.canManualResize || !this.isInResizingRegion(event)) {
				return;
			}
			this.isDragging = true;

			const container = this.getContainerDom();
			const startWidth = container.clientWidth;
			const startHeight = container.clientHeight;
			const nowWidth = startWidth + 'px';
			container.style.maxWidth = nowWidth;
			container.style.minWidth = nowWidth;
			container.style.width = nowWidth;
			const nowHeight = startHeight + 'px';
			container.style.maxHeight = nowHeight;
			container.style.minHeight = nowHeight;
			container.style.height = nowHeight;
			container.classList.add('resizing');

			const startX = event.clientX;
			const startY = event.clientY;
			const maxSpace = this.calMaxAvailableSpace();
			const maxAvailableHeight = maxSpace.height;
			const maxAvailableWidth = maxSpace.width;

			const mouseMoveHandler = event => {
				if (this.isDragging) {
					// 计算新的宽度
					let newWidth = startWidth + (event.clientX - startX);
					// 应用最小宽度限制
					newWidth = Math.max(100, newWidth);
					// 应用最大宽度限制
					newWidth = Math.min(newWidth, maxAvailableWidth);
					// 计算新的高度
					let newHeight = startHeight + (event.clientY - startY);
					// 应用最小高度限制
					newHeight = Math.max(32, newHeight);
					// 应用最大高度限制
					newHeight = Math.min(newHeight, maxAvailableHeight);
					// 设置容器尺寸
					const width = `${newWidth}px`;
					container.style.maxWidth = width;
					container.style.minWidth = width;
					container.style.width = width;
					const height = `${newHeight}px`;
					container.style.maxHeight = height;
					container.style.minHeight = height;
					container.style.height = height;
					// 存储尺寸用于样式计算
					this.manualHeight = newHeight;
				}
			};
			window.addEventListener('mousemove', mouseMoveHandler);
			const mouseUpHandler = () => {
				if (this.isDragging) {
					// 移除拖拽样式
					container.classList.remove('resizing');
					// 只有在拖拽结束时才标记为手动调整
					if (this.resizable === 'yes') {
						this.hasBeenResized = true;
					}
					window.removeEventListener('mousemove', mouseMoveHandler);
					window.removeEventListener('mouseup', mouseUpHandler);
					this.isDragging = false;
				}
			};
			window.addEventListener('mouseup', mouseUpHandler, {once: true});
		},
		toggleResizeMode() {
			this.hasBeenResized = !this.hasBeenResized;
			if (!this.hasBeenResized) {
				this.manualHeight = null;
				// 清除内联样式，让容器可以自动调整
				const container = this.getContainerDom();
				if (container) {
					container.style.maxWidth = '';
					container.style.minWidth = '';
					container.style.width = '';
					container.style.maxHeight = '';
					container.style.minHeight = '';
					container.style.height = '';
				}
				const textarea = this.getTextareaDom();
				if(textarea) {
					textarea.style.maxWidth = '';
					textarea.style.minWidth = '';
					textarea.style.width = '';
					textarea.style.maxHeight = '';
					textarea.style.minHeight = '';
					textarea.style.height = '';
				}
			}
		},
		isInResizingRegion(event) {
			const el = event.target;
			return event.offsetY > el.clientHeight - 16 && event.offsetX > el.clientWidth - 16;
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
			this.isDragging = false;
			this.hasBeenResized = false;
			// 如果是manual模式，初始化为内容高度
			if (newVal === 'manual') {
				this.$nextTick(() => {
					const textarea = this.getTextareaDom();
					if (textarea) {
						this.manualHeight = textarea.scrollHeight;
						this.hasBeenResized = true;
					}
				});
			}
		},
		// 监听initialContent变化
		initialContent(newValue) {
			this.initialValue = newValue;
		}
	}
};

// 定义组件样式
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
	max-width: 100%;
	min-width: 100%;
	height: 100%;
	max-height: 100%;
	min-height: 100%;
}

.c-input-container .p-textarea {
	position: relative;
	box-sizing: border-box;
	min-width: 100px;
	max-width: 100%;
	width: calc(100% - 36px);
	min-height: 2.5em;
	max-height: 100%;
	height: 100%;
	padding-right: 70px; /* 为按钮留出空间 */
}

.c-input-container.resizing .p-textarea {
	overflow: hidden !important;
	pointer-events: none !important;
	transition: none !important;
	min-height: 100% !important;
	max-height: 100% !important;
	height: 100% !important;
	min-width: 32px !important;
	max-width: calc(100% - 36px) !important;
	width: calc(100% - 36px) !important;
}

/* 手动模式下的文本域样式 */
.c-input-container .p-textarea.manual-resize {
	position: absolute !important;
	top: 0 !important;
	left: 0 !important;
	right: 36px !important;
	bottom: 0 !important;
	width: auto !important;
}

/* 内容操作按钮 */
.c-input-container .textarea-buttons {
	position: absolute;
	top: 0.5rem;
	right: 2.5rem;
	display: flex;
	gap: 5px;
}

.c-input-container .reset-button,.c-input-container .clear-button {
	background: rgba(255, 255, 255, 0.7);
	border: none;
	border-radius: 3px;
	width: 24px;
	height: 24px;
	display: flex;
	align-items: center;
	justify-content: center;
	cursor: pointer;
	font-size: 1.1rem;
}

.c-input-container .reset-button:hover,.c-input-container .clear-button:hover {
	background: #f0f0f0;
}

.c-input-container .clear-button:disabled {
	opacity: 0.5;
	cursor: not-allowed;
}

.c-input-container .resize-mode-toggle {
	position: absolute;
	top: 0.5rem;
	right: 0.5rem;
	cursor: pointer;
	font-size: 1.1rem;
	background: rgba(255, 255, 255, 0.7);
	border-radius: 3px;
	width: 28px;
	height: 24px;
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 10;
}

.c-input-container .resize-mode-toggle:hover {
	background: #f0f0f0;
}
.c-input-container .resize-mode-toggle i.left{
	font-size: 1.2rem;
}
.c-input-container .resize-mode-toggle i.right{
	font-size: 0.7em;
	margin-left:-8px;
}
`;

const CInputPlugin = {
	install(app) {
		// 将样式注入到页面
		if (typeof document !== 'undefined') {
			const styleId = 'c-input-styles';
			if (!document.getElementById(styleId)) {
				const style = document.createElement('style');
				style.id = styleId;
				style.textContent = cInputStyles;
				document.head.appendChild(style);
			}
		}

		// 注册全局组件
		app.component('c-input', CInput);
		// 添加全局版本信息
		app.config.globalProperties.$cInputVersion = '1.0.0';
		// 提供可注入的选项
		app.provide('cInputPlugin', true);
	}
};

// 自动注册到全局（如果通过script标签引入）
if (typeof window !== 'undefined') {
	window.CInput = CInput;
	window.CInputPlugin = CInputPlugin;
}