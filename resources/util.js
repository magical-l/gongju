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

function celsiusToKelvin(c) {
	return c + 273.15;
}

function celsiusToFahrenheit(c) {
	return c * 9 / 5 + 32;
}

function kelvinToCelsius(k) {
	return k - 273.15;
}

function fahrenheitToCelsius(f) {
	return (f - 32) * 5 / 9;
}

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
	const or = (o1, o2) => 'undefined' !== typeof o1 && o1 !== null ? o1 : o2;
	if (typeof $ !== 'undefined' && $?.fn) {
		$.fn.isEmpty = function () {
			return this.toArray().isEmpty();
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
	}
})();

