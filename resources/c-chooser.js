const CChooser = {
	name: 'CChooser',
	template: `
		<div class="c-chooser-container" ref="chooserContainer">
			<component :is="componentType"
								 v-model="internalValue" :options="processedOptions" data-key="value"
								 option-label="label" option-value="value"
								 :size="size" :variant="variant" :disabled="disabled" :option-disabled="'disabled'"
								 :invalid="isSelectionInvalid"

								 :multiple="isMultipleMode"
								 filter display="chip" show-clear
								 :max-selected-labels="3" :selected-items-label="selectedItemsLabel"
								 :placeholder="placeholder"

								 :allow-empty="true">
			</component>
		</div>
	`,
	components: {
		SelectButton: PrimeVue.SelectButton,
		MultiSelect: PrimeVue.MultiSelect,
		Dropdown: PrimeVue.Select
	},
	props: {
		modelValue: [String, Number, Array, Object],
		options: {type: Array, required: true, default: () => []},
		labelField: {type: String, default: null},
		valueField: {type: String, default: null},
		atLeast: {type: Number, default: 0},
		atMost: {type: Number, default: null},
		placeholder: {type: String, default: '请选择'},
		selectedItemsLabel: {type: String, default: '已选 {0} 项'},
		size: {type: String, default: null},
		variant: {type: String, default: 'outlined'},
		invalid: {type: Boolean, default: false},
		disabled: {type: Boolean, default: false},
		optionDisabled: {type: [String, Function], default: null}
	},
	emits: ['update:modelValue'],
	data() {
		return {
			componentType: 'SelectButton',// 默认使用按钮组，后续会通过宽度检查来动态修改
			resizeObserver: null,
			touched: false // 标记用户是否与组件交互过
		};
	},
	computed: {
		isMultipleMode() {
			// 如果 atMost 不等于 1 (比如是 null, 0, 或 > 1), 就允许多选
			return this.atMost !== 1;
		},
		// 统一处理选项，始终返回 {label, value, disabled} 格式的数组
		processedOptions() {
			return this.options.map(option => {
				const originalOption = option;
				let isDisabled = false;
				if (this.optionDisabled) {
					if (typeof this.optionDisabled === 'function') {
						isDisabled = this.optionDisabled(originalOption);
					} else if (typeof this.optionDisabled === 'string' && typeof originalOption === 'object' && originalOption
										 !== null) {
						isDisabled = !!originalOption[this.optionDisabled];
					}
				}

				if (typeof originalOption === 'object' && originalOption !== null && !Array.isArray(originalOption)) {
					const label = this.labelField ? originalOption[this.labelField] : this.getObjectLabel(originalOption);
					const value = this.valueField ? originalOption[this.valueField] : originalOption;
					return {label: String(label), value: value, disabled: isDisabled};
				}
				return {label: String(originalOption), value: originalOption, disabled: isDisabled};
			});
		},
		// 简化的双向绑定处理
		internalValue: {
			get() {
				// 如果是多选模式，确保 internalValue 始终是数组
				if (this.isMultipleMode) {
					return Array.isArray(this.modelValue) ? this.modelValue : [];
				}
				return this.modelValue;
			},
			set(newValue) {
				// 在多选模式下，确保值始终是数组 (SelectButton 清空时可能返回 null)
				const proposedValue = this.isMultipleMode ? newValue ?? [] : newValue;
				this.touched = true; // 用户已交互
				this.$emit('update:modelValue', proposedValue);
			}
		},
		isSelectionInvalid() {
			if (this.invalid) {
				return true;
			}
			if (!this.touched) {
				return false; // 未交互时不显示错误
			}
			const value = this.internalValue;
			const count = Array.isArray(value) ? value.length : (value === null || value === undefined ? 0 : 1);
			return count < this.atLeast || this.atMost !== null && count > this.atMost;

		}
	},
	methods: {
		// 检查容器宽度并决定使用哪个组件
		checkWidth() {
			this.componentType = 'SelectButton';//先假定是按钮组
			this.$nextTick(() => {
				const container = this.$refs.chooserContainer;
				if (!container) {
					return;
				}
				// 比较实际内容宽度和可见宽度
				const needsDropdown = container.scrollWidth > container.clientWidth;
				if (needsDropdown) {
					this.componentType = this.isMultipleMode ? 'MultiSelect' : 'Dropdown';
				}//else this.componentType = 'SelectButton';//不能在这里分支，否则会在 变成按钮组→宽度够→变成下拉框→宽度不够→变成按钮组 之间死循环
			});
		},
		// 从对象中智能获取用于显示的标签
		getObjectLabel(option) {
			const commonLabelKeys = ['label', 'name', 'title', 'text', 'key', 'txt',
															 'lable'//防呆：兼容使用者写的常见错别字
			];
			for (const key of commonLabelKeys) {
				if (option[key] !== undefined) {
					return option[key];
				}
			}
			// 如果找不到常见标签，则返回对象的JSON字符串形式
			return JSON.stringify(option);
		}
	},
	mounted() {
		// 组件挂载后，初始化 ResizeObserver 来监听容器尺寸变化
		this.resizeObserver = new ResizeObserver(() => {
			this.checkWidth();
		});
		this.resizeObserver.observe(this.$refs.chooserContainer);
		// 初始加载时也检查一次
		this.checkWidth();
	},
	beforeUnmount() {
		// 组件卸载前，停止监听并清理，防止内存泄漏
		if (this.resizeObserver) {
			this.resizeObserver.disconnect();
		}
	},
	watch: {
		// 当选项变化时，也需要重新检查宽度
		options: {
			handler() {
				this.checkWidth();
			},
			deep: true
		}
	}
};

const cChooserStyles = `
	.c-chooser-container {
		display: inline-block;
		min-width: 200px;
		width: 100%; /* 让容器撑满父级，以便正确测量可用宽度 */
	}
`;

const CChooserPlugin = {
	install(app) {
		// 将样式注入到页面
		if (typeof document !== 'undefined') {
			const styleId = 'c-chooser-styles';
			if (!document.getElementById(styleId)) {
				const style = document.createElement('style');
				style.id = styleId;
				style.textContent = cChooserStyles;
				document.head.appendChild(style);
			}
		}

		// 注册全局组件
		app.component('c-chooser', CChooser);
	}
};

// 自动注册到全局（如果通过script标签引入）
if (typeof window !== 'undefined') {
	window.CChooser = CChooser;
	window.CChooserPlugin = CChooserPlugin;
}