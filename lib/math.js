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
	NEGATIVE_SIGN: '负',
	DIGITS: [
		{lowerCase: '零', upperCase: '零', num: 0},
		{lowerCase: '一', upperCase: '壹', num: 1},
		{lowerCase: '二', upperCase: '贰', num: 2},
		{lowerCase: '三', upperCase: '叁', num: 3},
		{lowerCase: '四', upperCase: '肆', num: 4},
		{lowerCase: '五', upperCase: '伍', num: 5},
		{lowerCase: '六', upperCase: '陆', num: 6},
		{lowerCase: '七', upperCase: '柒', num: 7},
		{lowerCase: '八', upperCase: '捌', num: 8},
		{lowerCase: '九', upperCase: '玖', num: 9}
	],
	UNITS: [
		{lowerCase: '', upperCase: '', num: 1},
		{lowerCase: '十', upperCase: '拾', num: 10},
		{lowerCase: '百', upperCase: '佰', num: 100},
		{lowerCase: '千', upperCase: '仟', num: 1000},
		{lowerCase: '万', upperCase: '萬', num: 1e4}, // 1_0000
		{lowerCase: '亿', upperCase: '億', num: 1e8}, // 1_0000_0000
		{lowerCase: '兆', upperCase: '兆', num: 1e12}, // 1_0000_0000_0000
		{lowerCase: '京', upperCase: '京', num: 1e16}, // 1_0000_0000_0000_0000
		{lowerCase: '垓', upperCase: '垓', num: 1e20}, // 1_0000_0000_0000_0000_0000
		{lowerCase: '秭', upperCase: '秭', num: 1e24}, // 1_0000_0000_0000_0000_0000_0000
		{lowerCase: '穰', upperCase: '穰', num: 1e28}, // 1_0000_0000_0000_0000_0000_0000_0000
		{lowerCase: '沟', upperCase: '溝', num: 1e32}, // 1_0000_0000_0000_0000_0000_0000_0000_0000
		{lowerCase: '涧', upperCase: '澗', num: 1e36}, // 1_0000_0000_0000_0000_0000_0000_0000_0000_0000
		{lowerCase: '正', upperCase: '正', num: 1e40}, // 1_0000_0000_0000_0000_0000_0000_0000_0000_0000_0000
		{lowerCase: '载', upperCase: '載', num: 1e44}, // 1_0000_0000_0000_0000_0000_0000_0000_0000_0000_0000_0000
		{lowerCase: '极', upperCase: '極', num: 1e48} // 1_0000_0000_0000_0000_0000_0000_0000_0000_0000_0000_0000_0000
	],
	toUpperCase: s => Array.from(s).map(c => ChineseNum.DIGITS.of(c) ?? ChineseNum.UNITS.of(c)).filter(e => e)
	.map(e => e.upperCase).join('')
};
ChineseNum.DIGITS.of = c => (ChineseNum.DIGITS.filter(e => e.lowerCase === c || e.upperCase === c || e.num === c)
														 || [null])[0];
ChineseNum.UNITS.of = c => (ChineseNum.UNITS.filter(e => e.lowerCase === c || e.upperCase === c || e.num === c)
														|| [null])[0];

(() => {
	const CnDigits = ChineseNum.DIGITS;

	const say0 = () => CnDigits[0].lowerCase;
	/**
	 * 仅进行数码解析，不计算数位。
	 */
	const digitParse = (num, lowerCase = true) => {
		if (num === 0) {
			return say0();
		}
		const rt = String(num).split('')//
		.map(c => {
			const d = CnDigits.of(Number(c));
			if (d) {
				return lowerCase ? d.lowerCase : d.upperCase;
			}
			return c;
		})//
		.join('');
		if (rt.startsWith('-')) {
			return ChineseNum.NEGATIVE_SIGN + rt.substring(1);
		} else if (rt.startsWith('+')) {
			return ChineseNum.POSITIVE_SIGN + rt.substring(1);
		} else {
			return rt;
		}
	};

	/**
	 * 将一个四位以内的数字转换为中文，核心内部方法
	 */
	const 处理4位 = (positiveInt, lowerCase = true) => {
		if (positiveInt === 0) {
			return '零';
		}
		if (positiveInt < 0 || positiveInt > 9999) {
			return parseA(positiveInt, lowerCase);
		}

		const 十百千 = Math.floor(positiveInt / 10);
		const 百千 = 十百千 === 0 ? 0 : Math.floor(十百千 / 10);
		const 千位 = 百千 === 0 ? 0 : Math.floor(百千 / 10);
		const 百位 = 百千 % 10;
		const 十位 = 十百千 % 10;
		const 个位 = positiveInt % 10;

		let rt = '';
		if (千位 !== 0) {
			rt += lowerCase ? CnDigits[千位].lowerCase + '千' : CnDigits[千位].upperCase + '仟';
		}
		if (百位 !== 0) {
			rt += lowerCase ? CnDigits[百位].lowerCase + '百' : CnDigits[百位].upperCase + '佰';
		}
		if (十位 !== 0) {
			if (rt && 百位 === 0) {
				rt += '零';
			}
			rt += lowerCase ? CnDigits[十位].lowerCase + '十' : CnDigits[十位].upperCase + '拾';
		}
		if (个位 !== 0) {
			if (rt && 十位 === 0 && rt[rt.length - 1] !== '零') {
				rt += '零';
			}
			rt += lowerCase ? CnDigits[个位].lowerCase : CnDigits[个位].upperCase;
		}
		return rt;
	};

	/**
	 * 将一个阿拉伯数转化为中文数。
	 */
	const parseA = (num, lowerCase = true) => {
		if (num === 0) {
			return say0();
		}
		const absNum = Math.abs(num);
		const units = Object.values(ChineseNum.UNITS)//
		.filter(e => e.lowerCase !== '十' && e.lowerCase !== '百' && e.lowerCase !== '千');

		const sections = [];
		for (let n = absNum; n > 0; n = Math.floor(n / 10000)) {
			sections.push(n % 10000);
		}

		let rt = '';
		let needZero = false;
		for (let i = sections.length - 1; i >= 0; i--) {// 分段处理（从高段到低段）
			const section = sections[i];
			const unit = lowerCase ? units[i].lowerCase : units[i].upperCase;//todo：超过‘极’怎么处理？

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
				const s = 处理4位(section, lowerCase);
				if (rt && rt[rt.length - 1] !== say0() && (s.length < 2 || s[1] !== (lowerCase ? '千' : '仟'))) {
					rt += say0();
				}
				rt += s + unit;
			}
		}

		if (rt.startsWith(lowerCase ? '一十' : '壹拾')) {//去掉开头的“一十x”前面的“一”（如果要求使用“十x”而非“一十x”模式）
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

function convertToChineseNumber(input, fromRadix, lowerCase = true) {
	try {
		const decimal = convertToDecimal(input, fromRadix);
		if (decimal === '') {
			return '';
		}
		const num = parseInt(decimal, 10);
		if (isNaN(num)) {
			return '';
		}
		return ChineseNum.fromArabic(num, lowerCase);
	} catch (e) {
		return '';
	}
}

function convertToChineseDigitUpper(input, fromRadix) {
	const chnDigit = convertToChineseDigit(input, fromRadix);
	return chnDigit ? ChineseNum.toUpperCase(chnDigit) : '';
}

function convertToChineseNumberUpper(input, fromRadix) {
	return convertToChineseNumber(input, fromRadix, false);
}

function convertToStandardCommunicationDigits(num) {
	// 将输入的数字字符串转换为十进制数字
	const decimalNum = parseInt(num, 10);

	// 将十进制数字转换为标准通讯数字读音
	const communicationDigitsMap = {
		'0': '洞',
		'1': '幺',
		'2': '两',
		'3': '三',
		'4': '四',
		'5': '五',
		'6': '六',
		'7': '拐',
		'8': '八',
		'9': '九'
	};

	// 将数字转换为标准通讯数字读音
	let result = '';
	const numStr = decimalNum.toString();
	for (let i = 0; i < numStr.length; i++) {
		const digit = numStr[i];
		result += communicationDigitsMap[digit] || digit;
	}

	return result;
}

getRegexForRadix = radix => {
	switch (radix) {
		case 2:
			return /(0b)?[01]+/gi;
		case 8:
			return /(0o)?[0-7]+/gi;
		case 16:
			return /(0x)?[0-9a-f]+/gi;
		default:
			return /\d+/g;
	}
};
stripPrefix = (num, fromRadix) => {
	const lowerNum = num.toLowerCase();
	if (fromRadix === 16 && lowerNum.startsWith('0x')) {
		return num.substring(2);
	}
	if (fromRadix === 2 && lowerNum.startsWith('0b')) {
		return num.substring(2);
	}
	if (fromRadix === 8 && lowerNum.startsWith('0o')) {
		return num.substring(2);
	}
	return num;
};