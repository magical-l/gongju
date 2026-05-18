/**
 * CChooser 智能选择器组件 - Element Plus 实现
 * 功能：响应式切换（按钮组↔下拉框）、单选/多选自适应、数量验证
 * 用法：<c-chooser v-model="selected" :options="opts" at-least="1" at-most="3" />
 */
const CChooser = {
	name: 'CChooser',
	template: `
		<div class="c-chooser-container" ref="chooserContainer">
			<!-- 按钮组模式：单选 -->
			<el-radio-group v-if="isButtonMode && !isMultipleMode"
				v-model="internalValue"
				:size="size"
				:disabled="disabled">
				<el-radio-button v-for="opt in processedOptions"
					:key="opt.value"
					:value="opt.value"
					:disabled="opt.disabled">
					{{ opt.label }}
				</el-radio-button>
			</el-radio-group>
			<!-- 按钮组模式：多选 -->
			<el-checkbox-group v-if="isButtonMode && isMultipleMode"
				v-model="internalValue"
				:size="size"
				:disabled="disabled">
				<el-checkbox-button v-for="opt in processedOptions"
					:key="opt.value"
					:value="opt.value"
					:disabled="opt.disabled">
					{{ opt.label }}
				</el-checkbox-button>
			</el-checkbox-group>
			<!-- 下拉框模式 -->
			<el-select v-if="isDropdownMode"
				v-model="internalValue"
				:multiple="isMultipleMode"
				:clearable="true"
				:filterable="true"
				:collapse-tags="isMultipleMode"
				:collapse-tags-tooltip="isMultipleMode"
				:max-collapse-tags="3"
				:placeholder="placeholder"
				:size="size"
				:disabled="disabled"
				:style="{width: '100%'}">
				<el-option v-for="opt in processedOptions"
					:key="opt.value"
					:value="opt.value"
					:label="opt.label"
					:disabled="opt.disabled">
				</el-option>
			</el-select>
			<!-- 验证提示 -->
			<div v-if="showValidationError" class="validation-error">
				{{ validationMessage }}
			</div>
		</div>
	`,
	props: {
		modelValue: [String, Number, Array, Object],
		options: {type: Array, required: true, default: () => []},
		labelField: {type: String, default: null},
		valueField: {type: String, default: null},
		atLeast: {type: Number, default: 0},
		atMost: {type: Number, default: null},
		placeholder: {type: String, default: '请选择'},
		size: {type: String, default: 'default'},
		disabled: {type: Boolean, default: false},
		optionDisabled: {type: [String, Function], default: null}
	},
	emits: ['update:modelValue', 'validate'],
	data() {
		return {
			componentType: 'button', // 'button' | 'dropdown'
			resizeObserver: null,
			touched: false
		};
	},
	computed: {
		isMultipleMode() {
			return this.atMost !== 1;
		},
		isButtonMode() {
			return this.componentType === 'button';
		},
		isDropdownMode() {
			return this.componentType === 'dropdown';
		},
		processedOptions() {
			return this.options.map(option => {
				const originalOption = option;
				let isDisabled = false;
				if (this.optionDisabled) {
					if (typeof this.optionDisabled === 'function') {
						isDisabled = this.optionDisabled(originalOption);
					} else if (typeof this.optionDisabled === 'string' && typeof originalOption === 'object' && originalOption !== null) {
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
		internalValue: {
			get() {
				if (this.isMultipleMode) {
					return Array.isArray(this.modelValue) ? this.modelValue : [];
				}
				return this.modelValue;
			},
			set(newValue) {
				const proposedValue = this.isMultipleMode ? newValue ?? [] : newValue;
				this.touched = true;
				this.$emit('update:modelValue', proposedValue);
				this.$emit('validate', this.validateSelection(proposedValue));
			}
		},
		showValidationError() {
			return this.touched && !this.isValidSelection;
		},
		isValidSelection() {
			return this.validateSelection(this.internalValue).valid;
		},
		validationMessage() {
			const count = this.getSelectionCount();
			if (count < this.atLeast) {
				return `至少需要选择 ${this.atLeast} 项`;
			}
			if (this.atMost !== null && count > this.atMost) {
				return `最多可选择 ${this.atMost} 项`;
			}
			return '';
		}
	},
	methods: {
		getSelectionCount() {
			const value = this.internalValue;
			return Array.isArray(value) ? value.length : (value === null || value === undefined ? 0 : 1);
		},
		validateSelection(value) {
			const count = Array.isArray(value) ? value.length : (value === null || value === undefined ? 0 : 1);
			const valid = count >= this.atLeast && (this.atMost === null || count <= this.atMost);
			return {valid, count, atLeast: this.atLeast, atMost: this.atMost};
		},
		checkWidth() {
			this.componentType = 'button';
			this.$nextTick(() => {
				const container = this.$refs.chooserContainer;
				if (!container) {
					return;
				}
				// 检测是否溢出
				const needsDropdown = container.scrollWidth > container.clientWidth;
				if (needsDropdown) {
					this.componentType = 'dropdown';
				}
			});
		},
		getObjectLabel(option) {
			const commonLabelKeys = ['label', 'name', 'title', 'text', 'key', 'txt', 'lable'];
			for (const key of commonLabelKeys) {
				if (option[key] !== undefined) {
					return option[key];
				}
			}
			return JSON.stringify(option);
		}
	},
	mounted() {
		this.resizeObserver = new ResizeObserver(() => {
			this.checkWidth();
		});
		this.resizeObserver.observe(this.$refs.chooserContainer);
		this.checkWidth();
	},
	beforeUnmount() {
		if (this.resizeObserver) {
			this.resizeObserver.disconnect();
		}
	},
	watch: {
		options: {
			handler() {
				this.checkWidth();
			},
			deep: true
		}
	}
};

// 组件样式
const cChooserStyles = `
.c-chooser-container {
	display: inline-block;
	min-width: 200px;
	width: 100%;
	position: relative;
}

.c-chooser-container .el-radio-group,
.c-chooser-container .el-checkbox-group {
	display: flex;
	flex-wrap: wrap;
	gap: 8px;
}

.c-chooser-container .validation-error {
	color: var(--el-color-danger, #f56c6c);
	font-size: 12px;
	margin-top: 4px;
	line-height: 1;
}
`;

const CChooserPlugin = {
	install(app) {
		if (typeof document !== 'undefined') {
			const styleId = 'c-chooser-styles';
			if (!document.getElementById(styleId)) {
				const style = document.createElement('style');
				style.id = styleId;
				style.textContent = cChooserStyles;
				document.head.appendChild(style);
			}
		}
		app.component('c-chooser', CChooser);
	}
};

if (typeof window !== 'undefined') {
	window.CChooser = CChooser;
	window.CChooserPlugin = CChooserPlugin;
}