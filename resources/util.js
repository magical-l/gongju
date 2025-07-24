const isNull = o => o === null;
/**
 * 通常可用a=a||defaultVal来做，但若a为false、0等“假值”，又想保留a的原值，就用本方法。
 * @param o1
 * @param o2
 * @returns {*}
 */
const or = (o1, o2) => 'undefined' !== typeof o1 && !isNull(o1) ? o1 : o2;
const op = (func, args) => (func || $.noop).call(null, args);
const transRadix = (input, toRadix, fromRadix = 10) => parseInt(input, fromRadix).toString(toRadix);
const toMap = obj => {
	const map = new Map();
	Object.keys(obj).forEach(k => map.set(k, obj[k]));
	return map;
};
const treeToArray = (first, getChildren) => {
	let rt = [first];
	for (let i = 0; i < rt.length; i++) { //由于要改变源数组，用forEach做不到。
		rt = rt.concat(getChildren(rt[i]));
	}
	return rt;
	//下面这个方法也可以：
	// const f = (arr, node) => getChildren(node).reduce(f, arr.concat(node));
	// return f([], first);
};
//为了支持非ascii字符，我们用了一个开源的base64库而非浏览器原生的atob和btoa。
const encodeBase64 = source => Base64.encode(source);
const decodeBase64 = source => Base64.decode(source);

String.prototype.isEmpty = function () {
	return this.length === 0;
};
String.prototype.capitalize = function () {
	return this.length > 1 ? this.charAt(0).toUpperCase() + this.substr(1) : this;
};
String.prototype.replaceAll = function (s1, s2) {
	return this.replace(new RegExp(s1, "gm"), s2);
};
String.prototype.camelStyle = function () {
	return this.split('-').reduce((acc, cur) => acc + cur.capitalize());
};
String.prototype.hyphenStyle = function () {
	return this.split('').reduce((a, c) => {
		const lower = c.toLocaleLowerCase();
		return a + (lower === c ? c : '-' + c.toLowerCase());
	});
};
Array.prototype.isEmpty = function (filter) {
	return (filter ? this.filter(filter) : this).length === 0;
};
Array.prototype.clone = function () {
	return this.concat();
};
Array.prototype.remove = function (val) {
	const index = $.isFunction(val) ? this.findIndex(val) : this.indexOf(val);
	if (index > -1) {
		const rt = this[index];
		this.splice(index, 1);
		return rt;
	}
	return null;
};
Array.prototype.clear = function () {
	this.splice(0, this.length);
	return this;
};
Array.prototype.replace = function (oldVal, newVal) {
	const index = $.isFunction(oldVal) ? this.findIndex(oldVal) : this.indexOf(oldVal);
	if (index > -1) {
		this[index] = newVal;
	}
	return this;
};
Array.prototype.toMap = function (keyPropName) {
	return this.reduce((accumulator, cur) => accumulator.set(cur[keyPropName], cur), new Map());
};
Array.prototype.max = function (mapper) {
	return Math.max.apply({}, this.map(mapper));
};
Array.prototype.min = function (mapper) {
	return Math.min.apply({}, this.map(mapper));
};
Map.prototype.isEmpty = function () {
	return this.size === 0;
};
//配置toastr
if (typeof toastr !== 'undefined') {
	toastr.options.positionClass = 'toast-top-right';
}
const successNotice = (notice, cb) => {
	typeof toastr === 'undefined' ? alert(notice) : toastr.success(notice);
	return cb ? cb() : true;
};
const warnNotice = (notice, cb) => {
	typeof toastr === 'undefined' ? alert(notice) : toastr.warning(notice);
	return cb ? cb() : true;
};
const errorNotice = (notice, cb) => {
	typeof toastr === 'undefined' ? alert(notice) : toastr.error(notice);
	return cb ? cb() : false;
};
(() => {
	const orig = $.fn.remove;
	$.fn.remove = function () {
		const me = this;
		if (me.length > 0) {
			me.trigger(new $.Event('removing'));
			const events = $._data(me[0], 'events');
			const removedHandlers = events && events.removed && events.removed.length > 0 ?
				events.removed.map(e => e.handler) : null;
			const rt = orig.apply(this, arguments);
			if (removedHandlers) {
				removedHandlers.forEach(e => e($.Event('removed', {
					target: rt
				})));
			}
			return rt;
		} else {
			return orig.apply(this, arguments);
		}
	};
})(); //为jquery加removed事件
(() => {
	$.fn.isEmpty = function () {
		return this.toArray().isEmpty();
	};
	$.fn.removeClassMatch = function (matcher) {
		return this.removeClass((i, e) => e.split(' ').filter(oneClass => matcher(oneClass)));
	};
	$.fn.content = function (newVal) {
		if (arguments.length === 0) { //getter
			return this.toArray().map(e => {
				const ele = $(e);
				return ele.is(':input') ? ele.val() : ele.html();
			});
		} else { //setter
			const v = $.isFunction(newVal) ? newVal() : $.isArray(newVal) ? newVal.join(' ') : newVal;
			this.filter(':input:not(:radio,:checkbox,select)').val(v).trigger('input').filter('button').html(v);
			this.filter(':radio[value="' + v + '"]').click();
			this.filter(':checkbox[value="' + v + '"]').click();
			//todo:select没做。
			this.filter(':not(:input)').html(v);
			return this;
		}
	};
	$.fn.disabled = function (val) {
		if ('undefined' === typeof val) {
			return this.attr('disabled');
		}
		val = $.isFunction(val) ? val() : val;
		this.toggleClass('disabled', val).attr('disabled', val);
		if (this.parent().is('label.btn')) {
			this.parent().disabled(val);
		}
		return this;
	};
	$.fn.disable = function () {
		return this.disabled(true);
	};
	$.fn.enable = function () {
		return this.disabled(false);
	};
	$.fn.attrPend = function (attrName, attrHandler) {
		attrHandler = attrHandler || '';
		return attrHandler ? this.each((i, e) => {
			const ele = $(e);
			const oldVal = or(ele.attr(attrName), '');
			oldVal && ele.attr(attrName, $.isFunction(attrHandler) ? attrHandler(oldVal) : oldVal + attrHandler);
		}) : this;
	};
	$.fn.attrPendId = function (attrName, id) {
		id = id || this.attr('id');
		return 'undefined' !== typeof id ? this.attrPend(attrName, attr => attr + id) : this;
	};
	$.fn.forEach = function (cb) {
		return this.each((i, e) => cb(e, i));
	};
	$.fn.uniquifyIds = function (id) {
		if ('undefined' !== typeof id) {
			this.filter('[id]').attrPendId('id', id);
			this.filter('label[for]').attrPendId('for', id);
			this.filter(':input[type=radio]').attrPendId('name', id);
			this.filter(':input[type=checkbox]').attrPendId('name', id);
			this.find('[id]').attrPendId('id', id);
			this.find('label[for]').attrPendId('for', id);
			this.find(':input[type=radio]').attrPendId('name', id);
			this.find(':input[type=checkbox]').attrPendId('name', id);
		}
		return this;
	};
	$.fn.cloneTemplate = function (selector, id) {
		return $(this.map((i, e) => {
			const container = $(e);
			return container.children(selector + '.template').clone(true).removeClass('template').addClass('one')
				.uniquifyIds(id).appendTo(container)[0];
		}));
	};
	$.fn.listen = function (eventType, cb) {
		return this.off(eventType).on(eventType, cb);
	};
	$.fn.reset = function () {
		this.find('.one').remove();
		this.filter('form').each((i, e) => e.reset());
		this.find('form').each((i, e) => e.reset());
		return this;
	};
	$.fn.toJson = function () {
		const rt = {};
		$(this.serializeArray()).each(function () {
			const name = this.name;
			const value = this.value;
			let exist = rt[name];
			if (exist) {
				if ($.isArray(exist)) {
					exist.push(value);
				} else {
					rt[name] = [exist, value];
				}
			} else {
				rt[name] = value;
			}
		});
		return rt;
	};
})();
(() => {
	const backendPrefix = '';
	$.ajax.get = (path, cb) => $.getJSON(backendPrefix + path, {}, cb);
	$.ajax.post = (path, data, successCallback) => $.post(backendPrefix + path,
		typeof data === 'string' ? data : JSON.stringify(data), successCallback);
	$.ajax.put = (path, data, successCallback) => $.ajax({
		method: 'PUT',
		url: backendPrefix + path,
		data: typeof data === 'string' ? data : JSON.stringify(data),
		success: result => successCallback && $.isFunction(successCallback) && successCallback(result)
	});
	$.ajax.patch = (path, data, successCallback) => $.ajax({
		method: 'PATCH',
		url: backendPrefix + path,
		data: typeof data === 'string' ? data : JSON.stringify(data),
		success: result => successCallback && $.isFunction(successCallback) && successCallback(result)
	});
	$.ajax.del = (path, successCallback) => $.ajax({
		method: 'DELETE',
		url: backendPrefix + path,
		success: result => successCallback && $.isFunction(successCallback) && successCallback(result)
	});
})();

const getUrlParam = paramName => new URL(location.href).searchParams.get(paramName);

const inputVal = function (someParent, inputClassName) {
	const inputs = $(someParent).find(':input' + inputClassName);
	if (inputs.isEmpty()) {
		return null;
	}
	if (inputs.is(':radio')) {
		const checked = inputs.filter((i, e) => $(e).is(':checked'));
		return checked.isEmpty() ? null : checked.val();
	} else if (inputs.is(':checkbox')) {
		const checked = inputs.filter((i, e) => $(e).is(':checked'));
		return checked.isEmpty() ? [] : checked.map((i, e) => $(e).val()).get();
	} else if (inputs.length > 1) {
		return inputs.map((i, e) => $(e).val()).get();
	} else {
		return inputs.val();
	}
};
const isEllipsis = dom => {
	const checkDom = dom.cloneNode();
	checkDom.style.width = dom.offsetWidth + 'px';
	checkDom.style.height = dom.offsetHeight + 'px';
	checkDom.style.overflow = 'auto';
	checkDom.style.position = 'absolute';
	checkDom.style.zIndex = -1;
	checkDom.style.opacity = 0;
	checkDom.style.whiteSpace = "nowrap";
	checkDom.innerHTML = dom.innerHTML;

	const parent = dom.parentNode;
	parent.appendChild(checkDom);
	const rt = checkDom.scrollWidth > checkDom.offsetWidth;
	parent.removeChild(checkDom);
	return rt;
};