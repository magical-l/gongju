/**
 * MD5算法实现
 */
const MD5 = (() => {
	// ... (MD5 implementation remains unchanged)
})();
const md5 = input => MD5.hash(input);

/**
 * 汉语数字转换的核心定义和函数
 */
const ChineseNum = {
	POSITIVE_SIGN: '正',
	NEGATIVE_SIGN: '负'
};
(() => {
	const ChineseDigit = [
		{lowerCase: '零', upperCase: '零', num: 0},
		{lowerCase: '一', upperCase: '壹', num: 1},
		{lowerCase: '二', upperCase: '贰', num: 2},
		{lowerCase: '三', upperCase: '叁', num: 3},
		{lowerCase: '四', upperCase: '肆', num: 4},
		{lowerCase: '五', upperCase: '伍', num: 5},
		{lowerCase: '六', upperCase: '陆', num: 6},
		{lowerCase: '七', upperCase: '柒', num: 7},
		{lowerCase: '八', upperCase: '捌', num: 8},
		{lowerCase: '九', upperCase: '玖', num: 9},
		{lowerCase: '十', upperCase: '拾', num: 10},
		{lowerCase: '百', upperCase: '佰', num: 100},
		{lowerCase: '千', upperCase: '仟', num: 1000},
		{lowerCase: '万', upperCase: '萬', num: 10000},
		{lowerCase: '亿', upperCase: '億', num: 100000000}
	];
	ChineseDigit.of = c => (ChineseDigit.filter(e => e.lowerCase === c || e.upperCase === c || e.num === c) || [null])[0];
	ChineseNum.digits = () => ChineseDigit;
	ChineseNum.toUpperCase = s => Array.from(s).map(c => ChineseNum.digits().of(c)).filter(e => e).map(e => e.upperCase)
	.join('');

	const say0 = () => ChineseDigit[0].lowerCase;
	const 描述个位 = n => ChineseDigit[n].lowerCase;
	const 描述十位 = n => n === 0 ? '' : 描述个位(n) + '十';
	const 描述百位 = n => n === 0 ? '' : 描述个位(n) + '百';
	const 描述千位 = n => n === 0 ? '' : 描述个位(n) + '千';

	/**
	 * 仅进行数码解析，不计算数位。
	 */
	const digitParse = num => {
		if (num === 0) {
			return say0();
		}
		const negative = num < 0;
		const numToUse = negative ? -num : num;
		let rt = '';
		for (let n = numToUse; n !== 0; n = Math.floor(n / 10)) {
			rt = ChineseDigit[n % 10].lowerCase + rt;
		}
		return negative ? ChineseNum.POSITIVE_SIGN + rt : rt;
	};

	/**
	 * 将一个四位以内的数字转换为中文，核心内部方法
	 */
	const 处理4位 = positiveInt => {
		if (positiveInt === 0) {
			return say0();
		}
		if (positiveInt < 0 || positiveInt > 9999) {
			return parseA(positiveInt);
		}

		const 十百千 = Math.floor(positiveInt / 10);
		const 百千 = 十百千 === 0 ? 0 : Math.floor(十百千 / 10);
		const 千位 = 百千 === 0 ? 0 : Math.floor(百千 / 10);
		const 百位 = 百千 % 10;
		const 十位 = 十百千 % 10;
		const 个位 = positiveInt % 10;

		let rt = '';
		if (千位 !== 0) {
			rt += 描述千位(千位);
		}
		if (百位 !== 0) {
			rt += 描述百位(百位);
		}
		if (十位 !== 0) {
			if (rt && 百位 === 0) {
				rt += say0();
			}
			rt += 描述十位(十位);
		}
		if (个位 !== 0) {
			if (rt && 十位 === 0 && rt[rt.length - 1] !== '零') {
				rt += say0();
			}
			rt += 描述个位(个位);
		}
		return rt;
	};

	/**
	 * 将一个阿拉伯数转化为中文数。
	 */
	const parseA = num => {
		if (num === 0) {
			return say0();
		}
		const absNum = Math.abs(num);
		const unitStages = ['', '万', '亿', '兆', '京', '垓', '秭', '穰', '沟', '涧', '正', '载', '极'];

		const sections = [];
		for (let n = absNum; n > 0; n = Math.floor(n / 10000)) {
			sections.push(n % 10000);
		}

		let rt = '';
		let needZero = false;
		for (let i = sections.length - 1; i >= 0; i--) {// 分段处理（从高段到低段）
			const section = sections[i];
			const unit = unitStages[i];//todo：超过‘极’怎么处理？

			if (section === 0) {//不可能是首段，首段不可能为0。
				if (rt && rt[rt.length - 1] !== say0()) {
					needZero = true;
				}
			} else {
				if (needZero) {// 添加段间零位（当检测到空段时）
					rt += say0();
					needZero = false;
				}
				// 添加当前段
				const s = 处理4位(section);
				if (rt && rt[rt.length - 1] !== say0() && (s.length < 2 || s[1] !== '千')) {
					rt += say0();
				}
				rt += s + unit;
			}
		}

		if (rt.startsWith('一十')) {
			//去掉开头的“一十x”前面的“一”（如果要求使用“十x”而非“一十x”模式）
			rt = rt.substring(1);
		}
		return (num < 0 ? ChineseNum.NEGATIVE_SIGN : '') + rt;
	};

	ChineseNum.digitsFromArabic = digitParse;
	ChineseNum.fromArabic = parseA;
})();

/**
 * 数字转换工具函数 (页面直接调用部分)
 */
function convertToDecimal(input, fromRadix) {
	try {
		if (!input || !input.trim()) {
			return '';
		}
		if (fromRadix === 62) {
			return base62ToDecimal(input);
		}
		const num = parseInt(input.trim(), fromRadix);
		return isNaN(num) ? '' : num.toString();
	} catch (e) {
		return '';
	}
}

function convertToBinary(input, fromRadix) {
	const decimal = convertToDecimal(input, fromRadix);
	return decimal ? parseInt(decimal).toString(2) : '';
}

function convertToHex(input, fromRadix) {
	const decimal = convertToDecimal(input, fromRadix);
	return decimal ? parseInt(decimal).toString(16).toUpperCase() : '';
}

function convertToOctal(input, fromRadix) {
	const decimal = convertToDecimal(input, fromRadix);
	return decimal ? parseInt(decimal).toString(8) : '';
}

function base62ToDecimal(input) {
	const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
	let result = 0;
	for (let i = 0; i < input.length; i++) {
		const value = chars.indexOf(input[i]);
		if (value === -1) {
			return '';
		}
		result = result * 62 + value;
	}
	return result.toString();
}

function convertToChineseDigit(input, fromRadix) {
	const decimal = convertToDecimal(input, fromRadix);
	if (!decimal) {
		return '';
	}
	const digits = ['〇', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
	return decimal.split('').map(d => digits[parseInt(d)]).join('');
}

// --- Updated Chinese Number Conversion Functions ---

function convertToChineseNumber(input, fromRadix) {
	try {
		const decimal = convertToDecimal(input, fromRadix);
		if (decimal === '') {
			return '';
		}
		const num = parseInt(decimal, 10);
		if (isNaN(num)) {
			return '';
		}
		return ChineseNum.fromArabic(num);
	} catch (e) {
		return '';
	}
}

function convertToChineseDigitUpper(input, fromRadix) {
	const chnDigit = convertToChineseDigit(input, fromRadix);
	return chnDigit ? ChineseNum.toUpperCase(chnDigit) : '';
}

function convertToChineseNumberUpper(input, fromRadix) {
	const chnNum = convertToChineseNumber(input, fromRadix);
	return chnNum ? ChineseNum.toUpperCase(chnNum) : '';
}
