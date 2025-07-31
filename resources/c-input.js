// 定义C-Input组件
const CInput = {
	name: 'CInput',
	template: `
		<div class="c-input-container" :class="{'resizing': isDragging}">
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
			startHeight: 0
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
				resize: this.resizable === 'yes' || this.resizable === 'manual' ? 'both' : 'none'
			};
			// 当手动调整过时固定高度
			if (this.hasBeenResized && this.manualHeight) {
				const height = `${this.manualHeight}px`;
				style.height = height;
				style.minHeight = height;
				style.maxHeight = height;
				// 确保滚动条出现
				style.overflowY = 'auto';
			} else if (this.minRows > 0) {// 其他模式设置最小高度
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
				// if (this.isAutoResizeEffectivelyOn) {
				// 	this.$nextTick(this.adjustHeightForContent);
				// }
			}
		}
	},
	methods: {
		onMouseDown(event) {
			const isResizable = ['yes', 'manual'].includes(this.resizable);
			if (isResizable && this.isResizing(event)) {
				this.isDragging = true;
				const textarea = this.$refs.textarea.$el;

				this.startY = event.clientY;
				this.startHeight = textarea.clientHeight;

				// 添加临时样式优化拖拽体验
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
				const newHeight = this.startHeight + (event.clientY - this.startY);
				this.manualHeight = Math.max(32, newHeight);
			}
		},
		onDragEnd() {
			if (this.isDragging) {
				this.isDragging = false;

				// 重置临时样式
				if (this.$refs.textarea) {
					const textarea = this.$refs.textarea.$el;
					textarea.style.transition = '';
					textarea.style.overflow = '';
				}

				window.removeEventListener('mousemove', this.onDragMove);

				// 对于yes模式，标记已手动调整
				if (this.resizable === 'yes') {
					this.hasBeenResized = true;
				}
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
	display: inline-block;
	position: relative;
	width: 100%;
}

	.c-input-container .p-textarea {
	width: 100%;
	min-height: 2.5em;
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

	.resize-mode-toggle:hover {
	background: #f0f0f0;
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