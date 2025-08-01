// 定义C-Input组件
const CInput = {
	name: 'CInput',
	template: `
    <div class="c-input-container" :class="{'resizing': isDragging}" ref="container">
      <p-textarea v-model="internalValue" ref="textarea"
                  :placeholder="placeholder"
                  :size="size" :variant="variant" :disabled="disabled"
                  :invalid="invalid"
                  :rows="minRows" :auto-resize="isAutoResizeOn"
                  :class="{'manual-resize': hasBeenResized}"
                  :style="textareaStyle"
                  @mousedown="onMouseDown">
      </p-textarea>
      <span :title="isUnderManual ? '切换到自动' : '切换到手动'" v-if="showToggleButton"
            class="resize-mode-toggle" @click="toggleResizeMode">{{ isUnderManual ? '🔒' : '🔄' }}</span>
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
		disabled: {type: Boolean, default: false}
	},
	data() {
		return {
			isDragging: false,
			manualHeight: null,
			hasBeenResized: false,
			startY: 0,
			startHeight: 0,
			maxAvailableHeight: null,
			maxAvailableWidth: null
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
				resize: this.resizable === 'yes' || this.resizable === 'manual' ? 'both' : 'none',
				width: 'calc(100% - 36px)',
				boxSizing: 'border-box'
			};

			// 当手动调整过时
			if (this.hasBeenResized) {
				// 移除宽度限制，由绝对定位控制
				delete style.width;
			} else if (this.minRows > 0) {
				style.minHeight = `${this.minRows * 1.5}rem`;
			}
			return style;
		},
		containerStyle() {
			const style = {};
			if (this.hasBeenResized) {
				if (this.manualHeight) {
					style.height = `${this.manualHeight}px`;
					style.minHeight = `${this.manualHeight}px`;
					style.maxHeight = `${this.manualHeight}px`;
				}
				if (this.manualWidth) {
					style.width = `${this.manualWidth}px`;
					style.minWidth = `${this.manualWidth}px`;
					style.maxWidth = `${this.manualWidth}px`;
				}
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
			const containerRect = container.getBoundingClientRect();
			const parent = container.parentElement;
			if (!parent) {
				return {height: null, width: null};
			}
			const parentRect = parent.getBoundingClientRect();
			return {
				height: parentRect.height - (containerRect.top - parentRect.top),
				width: parentRect.width - (containerRect.left - parentRect.left)
			};
		},
		onMouseDown(event) {
			if (this.canManualResize && this.isInResizingRegion(event)) {
				this.isDragging = true;
				const container = this.getContainerDom();
				// 记录初始位置和尺寸
				this.startX = event.clientX;
				this.startY = event.clientY;
				this.startWidth = container.clientWidth;
				this.startHeight = container.clientHeight;
				const maxSpace = this.calMaxAvailableSpace();
				this.maxAvailableHeight = maxSpace.height;
				this.maxAvailableWidth = maxSpace.width;
				// 添加拖拽样式
				container.classList.add('resizing');

				window.addEventListener('mousemove', this.onDragMove);
				window.addEventListener('mouseup', this.onDragEnd, {once: true});
			}
		},
		onDragMove(event) {
			if (this.isDragging) {
				if (this.resizable === 'yes') {
					this.hasBeenResized = true;
				}
				// 计算新的宽度
				let newWidth = this.startWidth + (event.clientX - this.startX);
				// 应用最小宽度限制
				newWidth = Math.max(100, newWidth);
				// 应用最大宽度限制
				newWidth = Math.min(newWidth, this.maxAvailableWidth);
				// 计算新的高度
				let newHeight = this.startHeight + (event.clientY - this.startY);
				// 应用最小高度限制
				newHeight = Math.max(32, newHeight);
				// 应用最大高度限制
				newHeight = Math.min(newHeight, this.maxAvailableHeight);
				// 设置容器尺寸
				this.getContainerDom().style.width = `${newWidth}px`;
				this.getContainerDom().style.height = `${newHeight}px`;
				// 存储尺寸用于样式计算
				this.manualWidth = newWidth;
				this.manualHeight = newHeight;
			}
		},
		onDragEnd() {
			if (this.isDragging) {
				// 移除拖拽样式
				this.getContainerDom().classList.remove('resizing');
				const textarea = this.getTextareaDom();
				if (textarea) {
					textarea.style.transition = '';
					textarea.style.overflow = '';
				}
				this.maxAvailableWidth = null;
				this.maxAvailableHeight = null;
				this.isDragging = false;
				window.removeEventListener('mousemove', this.onDragMove);
			}
		},
		toggleResizeMode() {
			this.hasBeenResized = !this.hasBeenResized;
			if (!this.hasBeenResized) {
				this.manualHeight = null;
				this.manualWidth = null;
				// 清除内联样式，让容器可以自动调整
				const container = this.getContainerDom();
				if (container) {
					container.style.width = '';
					container.style.height = '';
				}
			}
		},
		isInResizingRegion(event) {
			const el = event.target;
			return event.offsetY > el.clientHeight - 16 && event.offsetX > el.clientWidth - 16;
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
		}
	},
	beforeUnmount() {
		window.removeEventListener('mouseup', this.onDragEnd);
		window.removeEventListener('mousemove', this.onDragMove);
		// 清理可能存在的其他监听器
		if (this.isDragging) {
			window.removeEventListener('mouseup', this.onDragEnd);
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

.c-input-container .p-textarea {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 2.5em;
  box-sizing: border-box;
}

.c-input-container.resizing .p-textarea {
  overflow: hidden !important;
  pointer-events: none !important;
  transition: none !important;
}

.resize-mode-toggle {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  cursor: pointer;
  font-size: 1.1rem;
  background: rgba(255, 255, 255, 0.7);
  border-radius: 3px;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
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