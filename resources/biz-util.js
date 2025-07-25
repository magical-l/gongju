const backendPrefix = '';

$.ajaxSetup({
	contentType: 'application/json;charset=UTF-8',
	error: result => {
		if (result.status === 400) {
			let message = '【' + result.responseJSON.argName + '】错误。';
			if (typeof result.responseJSON.expectVal !== 'undefined' && result.responseJSON.expectVal != null) {
				message += '期望：' + result.responseJSON.expectVal + '。';
			}
			if (typeof result.responseJSON.actualVal !== 'undefined' && result.responseJSON.actualVal != null) {
				message += '实际：' + result.responseJSON.actualVal + '。';
			}
			alert(message);
		} else if (result.status === 401) {
			alert('没有权限。可能是登录已过期，请重新登录试试。如果还是没有权限，请联系管理员开通。');
		} else if (result.status === 404) {
			let message = '没有这个东西';
			if (typeof result.responseJSON.thingType !== 'undefined' && result.responseJSON.thingType != null) {
				message += '：类型为【' + result.responseJSON.thingType + '】，id为【' + result.responseJSON.thingId + '】';
			}
			alert(message);
		} else if (result.status === 409) {
			let message = '状态【' + result.responseJSON.statusName + '】错误。';
			if (typeof result.responseJSON.expectVal !== 'undefined' && result.responseJSON.expectVal != null) {
				message += '期望：' + result.responseJSON.expectVal + '。';
			}
			if (typeof result.responseJSON.actualVal !== 'undefined' && result.responseJSON.actualVal != null) {
				message += '实际：' + result.responseJSON.actualVal + '。';
			}
			alert(message);
		} else if (result.status === 500) {
			alert('服务器发生了错误，请联系系统管理员。');
		} else {
			alert('失败。别重试了，找人吧。');
		}
		return false;
	}
});

const updatePropOnBlur = option => {
	const item = option.item;
	const itemType = option.itemType.hyphenStyle();
	const propName = option.propName;
	const cb = option.cb;
	const hyphenStyle = propName.hyphenStyle();
	const camelStyle = propName.camelStyle();
	const path = option.path || '/admin/' + itemType + 's/' + item.id + '/' + hyphenStyle;
	option.oneArea.find('.' + itemType + '.' + hyphenStyle + '.input').not('button').on('blur', event => { //修改属性
		//由于有时不是:input而是:not(:input)[contentEditable]，所以不用val()。
		const newVal = [].concat($(event.currentTarget).content())[0].replaceAll('<br>', '\n').trim();
		if (newVal !== item[camelStyle]) {
			put(path, newVal, () => {
				successNotice('修改成功。');
				item[camelStyle] = newVal;
				cb && cb(newVal);
			});
		} else {
			cb && cb(newVal);
		}
	});
};
const updateVal = (selector, oldVal, newVal) => {
	const area = $(selector);
	area.filter((i, e) => $(e).html() === oldVal).html(newVal);
	area.filter((i, e) => $(e).val() === oldVal).val(newVal);
};
const findHolder = (ele, dataName) => $($(ele).parents().filter((i, e) => $(e).data(dataName))[0]);
const findData = (ele, dataName) => findHolder(ele, dataName).data(dataName);
const checkPropNames = (item, propNames) => propNames && !propNames.isEmpty() ? propNames : Object.keys(item);
const showItem = option => {
	const itemType = option.itemType;
	const item = option.item;
	const oneArea = option.oneArea;
	oneArea.data(itemType, item);
	checkPropNames(item, option.propNames).forEach(propName => {
		const propArea = oneArea.find('.' + itemType + '.' + propName.hyphenStyle());
		const val = item[propName.camelStyle()];
		if (!$.isArray(val)) {
			propArea.content(val);
			updatePropOnBlur({
				item: item,
				itemType: itemType,
				oneArea: oneArea,
				propName: propName,
				path: option.path ? option.path + '/' + propName.hyphenStyle() : undefined,
				cb: newVal => {
					propArea.content(newVal);
					option.blurred && option.blurred(newVal, propName, option);
				}
			});
		}
	});
};
const showItems = option => {
	const itemType = option.itemType;
	const container = option.container;
	const eachCallback = option.eachCallback;
	container.find('.one.' + itemType).remove();
	option.items.forEach(item => {
		const oneArea = container.cloneTemplate('.' + itemType);
		showItem({
			item: item,
			itemType: itemType,
			oneArea: oneArea,
			propNames: option.propNames
		});
		eachCallback && eachCallback(item, oneArea);
	});
};
$(() => {
	$('textarea.auto-height ').on('input propertychange', e => {
		const textarea = $(e.currentTarget);
		if (textarea.val()) {
			const area = textarea.parentsUntil('.source.area').parent();
			area.find('.op.area').removeClass('hidden');
		}
		textarea.css('overflow', 'hidden').css('height', textarea.prop('scrollHeight'));
	});
});

function toggleDescription() {
	const description = document.querySelector('.description');
	const button = document.querySelector('.toggle-description');
	if (description.style.display === 'none') {
		description.style.display = 'block';
		button.textContent = '隐藏说明';
	} else {
		description.style.display = 'none';
		button.textContent = '查看说明';
	}
}