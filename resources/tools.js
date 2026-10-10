/*
 * 全站工具清单 —— 首页卡片与各页顶部导航共用的唯一数据源。
 *
 * href / thumb 都是「相对站点根」的路径，不含 ../；
 * 各页面渲染时用自己 <nav> 上的 data-root 前缀拼出实际路径。
 * thumb 为空表示该工具暂无缩略图，卡片走图标占位。
 */
(function (root) {
	'use strict';

	root.TOOLS = [
		/*---------- 文本与编码 ----------*/
		{ cat: '文本与编码', icon: '🔤', name: '文本转化', desc: '编码解码、哈希、大小写转换',
			href: '编解码/文本转化.html', thumb: '编解码/thumbnails/文本转化.jpg' },
		{ cat: '文本与编码', icon: '🔢', name: '数字转化', desc: '进制互转、中文与通讯数字写法',
			href: '编解码/数字转化.html', thumb: '编解码/thumbnails/数字转化.jpg' },
		{ cat: '文本与编码', icon: '⬡', name: 'SVG转图标', desc: '',
			href: '编解码/svg转图标.html', thumb: '编解码/thumbnails/svg转图标.jpg' },

		/*---------- 字符与图形 ----------*/
		{ cat: '字符与图形', icon: '✳️', name: '符号', desc: 'Unicode 字符大全，按标签浏览与一键复制',
			href: '符号/符号.html', thumb: '符号/thumbnails/符号.jpg' },
		{ cat: '字符与图形', icon: '▦', name: '格子盘', desc: '画网格并编辑每格内容',
			href: '格子盘.html', thumb: '' },

		/*---------- 学科学习 ----------*/
		{ cat: '学科学习', icon: '⚛️', name: '元素周期表', desc: '',
			href: '化学/元素周期表.html', thumb: '化学/thumbnails/元素周期表.jpg' },
		{ cat: '学科学习', icon: '🅰️', name: '拼音', desc: '声母韵母组合拼读练习',
			href: '拼音/拼音.html', thumb: '拼音/thumbnails/拼音.jpg' },

		/*---------- 游戏 ----------*/
		{ cat: '游戏', icon: '♟️', name: '中国象棋', desc: '双人对弈的中式象棋，可摆残局、记谱',
			href: '游戏/中国象棋/中国象棋.html', thumb: '游戏/中国象棋/thumbnails/中国象棋.jpg' },
		{ cat: '游戏', icon: '⚪', name: '五子棋', desc: '双人对弈的五子棋',
			href: '游戏/五子棋/gobang.html', thumb: '游戏/五子棋/thumbnails/五子棋.jpg' },
		{ cat: '游戏', icon: '🧱', name: '俄罗斯方块', desc: '',
			href: '游戏/俄罗斯方块.html', thumb: '游戏/thumbnails/俄罗斯方块.jpg' },
		{ cat: '游戏', icon: '🐍', name: '贪吃蛇', desc: '',
			href: '游戏/贪吃蛇/贪吃蛇.html', thumb: '游戏/贪吃蛇/thumbnails/贪吃蛇.jpg' },
		{ cat: '游戏', icon: '🎲', name: '2048', desc: '',
			href: '游戏/2048/2048.html', thumb: '游戏/2048/thumbnails/2048.jpg' },
		{ cat: '游戏', icon: '🟩', name: '2048蛇', desc: '2048 与贪吃蛇合体',
			href: '游戏/2048蛇/2048蛇.html', thumb: '游戏/2048蛇/thumbnails/2048蛇.jpg' },
		{ cat: '游戏', icon: '🧩', name: '2048方块', desc: '2048 与俄罗斯方块合体（落块、合并、满行消除）',
			href: '游戏/2048方块/2048方块.html', thumb: '游戏/2048方块/thumbnails/2048方块.jpg' },
		{ cat: '游戏', icon: '💡', name: '点灯', desc: '点一下连带翻转，把灯全点亮',
			href: '游戏/点灯.html', thumb: '游戏/thumbnails/点灯.jpg' },
		{ cat: '游戏', icon: '🔀', name: '数字华容道', desc: '',
			href: '游戏/数字华容道.html', thumb: '游戏/thumbnails/数字华容道.jpg' },
		{ cat: '游戏', icon: '✨', name: '星连星', desc: '同色星连线填满棋盘的益智游戏',
			href: '游戏/星连星/星连星.html', thumb: '游戏/星连星/thumbnails/星连星.jpg' }
	];
})(typeof self !== 'undefined' ? self : this);
