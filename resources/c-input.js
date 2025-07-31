// 定义C-Input组件
const CInput = {
	name: 'CInput',
	template: `
    <div class="c-input-container" :class="{'resizing': isDragging}" ref="container">
      <p-textarea v-model="internalValue" ref="textarea"
                :placeholder="placeholder"
                :size="size" :variant="variant" :disabled="disabled"
                :invalid="invalid"
                :rows="minRows" :auto-resize="isAutoResizeEffectivelyOn"
                :style="textareaStyle"
                @mousedown="onMouseDown">
      </p-textarea>
      <span :title="isManualMode ? '切换到自动' : '切换到手动'" v-if="showToggleButton"
            class="resize-mode-toggle" @click="toggleResizeMode">{{ isManualMode ? '🔒' : '🔄' }}</span>
    </div>
  `,
	components: {
		'p-textarea': PrimeVue ? PrimeVue.Textarea : {}
	},
	props: {
		modelValue: [String, Number],
		placeholder: {type: String, default: ''},
		minRows: {type: Number, default: 1},
		resizable: {
			type: String,
			default: 'yes',
			validator: value => ['yes', 'auto', 'manual', 'no'].includes(value)
		},
		size: {type: String, default: null},
		variant: {type: String, default: 'outlined'},
		invalid: {type: Boolean, default: false},
		disabled: {type: Boolean, default: false}
	},
	data() {
		return {
			isDragging: false,
			manualHeight: null,
			hasBeenResized: false,
			startY: 0,
			startHeight: 0,
			maxAvailableWidth: null,
			maxAvailableHeight: null
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
		isAutoResizeEffectivelyOn() {
			// 禁用情况：拖拽中 | yes模式已调整 | 非自动调整模式
			if (this.isDragging) {
				return false;
			}
			return this.resizable === 'auto' || this.resizable === 'yes' && !this.hasBeenResized;
		},
		textareaStyle() {
			const style = {
				resize: this.resizable === 'yes' || this.resizable === 'manual' ? 'both' : 'none',
				overflow: 'auto',
				width: 'calc(100% - 30px)', // 关键修改：留出按钮空间
				height: '100%'
			};

			// 当手动调整过时
			if (this.hasBeenResized) {
				// 使用绝对定位保持正确布局
				style.position = 'absolute';
				// style.top = '0';
				// style.left = '0';
				// style.right = '30px'; // 为按钮留出空间
				// style.bottom = '0';
			} else if (this.minRows > 0) {
				style.minHeight = `${this.minRows * 1.5}rem`;
			}
			return style;
		},
		containerStyle() {
			const style = {};
			if (this.hasBeenResized) {
				if (this.manualHeight) {
					const height = `${this.manualHeight}px`;
					style.height = height;
					style.minHeight = height;
					style.maxHeight = height;
				}
				if (this.manualWidth) {
					const width = `${this.manualWidth}px`;
					style.width = width;
					style.minWidth = width;
					style.maxWidth = width;
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
		}
	},
	methods: {
		onMouseDown(event) {
			const isResizable = ['yes', 'manual'].includes(this.resizable);
			if (isResizable && this.isResizing(event)) {
				this.isDragging = true;
				const container = this.$refs.container;
				const textarea = this.$refs.textarea.$el;

				// 获取父容器（container的父元素）
				const parentContainer = container.parentElement;

				if (parentContainer) {
					// 获取父容器在文档中的位置
					const parentRect = parentContainer.getBoundingClientRect();

					// 获取容器在文档中的位置
					const containerRect = container.getBoundingClientRect();

					// 计算容器顶部到父容器顶部的距离
					const topOffset = containerRect.top - parentRect.top;

					// 计算容器左侧到父容器左侧的距离
					const leftOffset = containerRect.left - parentRect.left;

					// 计算最大可用高度 = 父容器高度 - 容器顶部偏移量
					this.maxAvailableHeight = parentRect.height - topOffset;

					// 计算最大可用宽度 = 父容器宽度 - 容器左侧偏移量
					this.maxAvailableWidth = parentRect.width - leftOffset;
				}

				// 记录初始位置和尺寸
				this.startX = event.clientX;
				this.startY = event.clientY;
				this.startWidth = container.clientWidth;
				this.startHeight = container.clientHeight;

				// 添加拖拽样式
				container.classList.add('resizing');
				textarea.style.transition = 'none';
				textarea.style.overflow = 'hidden';

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
				if (this.maxAvailableWidth) {
					newWidth = Math.min(newWidth, this.maxAvailableWidth);
				}

				// 计算新的高度
				let newHeight = this.startHeight + (event.clientY - this.startY);
				// 应用最小高度限制
				newHeight = Math.max(32, newHeight);
				// 应用最大高度限制
				if (this.maxAvailableHeight) {
					newHeight = Math.min(newHeight, this.maxAvailableHeight);
				}

				// 设置容器尺寸
				this.$refs.container.style.width = `${newWidth}px`;
				this.$refs.container.style.height = `${newHeight}px`;

				// 存储尺寸用于样式计算
				this.manualWidth = newWidth;
				this.manualHeight = newHeight;
			}
		},
		onDragEnd() {
			if (this.isDragging) {
				this.isDragging = false;
				this.maxAvailableWidth = null;
				this.maxAvailableHeight = null;

				// 移除拖拽样式
				this.$refs.container.classList.remove('resizing');

				if (this.$refs.textarea) {
					const textarea = this.$refs.textarea.$el;
					textarea.style.transition = '';
					textarea.style.overflow = '';
				}

				window.removeEventListener('mousemove', this.onDragMove);
			}
		},
		toggleResizeMode() {
			this.hasBeenResized = !this.hasBeenResized;

			if (!this.hasBeenResized) {
				this.manualHeight = null; // 这个操作足够触发自动模式
			}
		},
		isResizing(event) {
			const el = event.target;
			return event.offsetY > el.clientHeight - 16 && event.offsetX > el.clientWidth - 16;
		},
		adjustHeightForContent() {
			if (this.isDragging || !this.$refs.textarea || this.hasBeenResized) {
				return;
			}

			const textarea = this.$refs.textarea.$el;
			if (textarea && this.isAutoResizeEffectivelyOn) {
				// 重置高度让自动调整生效
				textarea.style.height = 'auto';
				// 重新设置高度为内容高度
				textarea.style.height = `${textarea.scrollHeight}px`;
			}
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
					if (this.$refs.textarea) {
						const textarea = this.$refs.textarea.$el;
						this.manualHeight = textarea.scrollHeight;
						this.hasBeenResized = true;
					}
				});
			}
		}
	},
	mounted() {
		this.$nextTick(() => {
			// 确保初始化时高度正确
			if (this.$refs.textarea) {
				this.adjustHeightForContent();
			}
		});
	},
	beforeUnmount() {
		window.removeEventListener('mouseup', this.onDragEnd);
		window.removeEventListener('mousemove', this.onDragMove);
	}
};

// 定义组件样式
const cInputStyles = `
.c-input-container {
  position: relative;
  top: 0;
  bottom: 0;
  left: 0;
  right: 36px;
  display: inline-block;
  box-sizing: border-box;
  width: 100%;
  max-height: 100%;
  min-height: 2.5rem;
}

.c-input-container .p-textarea {
  position: relative;
  top: 0;
  bottom: 0;
  left: 0;
  right: 36px;
  width: 100%;
  height: 100%;
  min-height: 2.5em;
  box-sizing: border-box;
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
`;

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

// 创建CInput插件对象
const CInputPlugin = {
	install(app) {
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