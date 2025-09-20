const 内置插件集 = {
	'记谱': class extends Plugin {
		unitName;
		roundNotations = [];

		constructor(gaming, cfg) {
			const 汉语数字 = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
			/**
			 * 判断移动方向跟进攻方向一致
			 * @param rowDiff
			 * @param forwardDirection
			 * @returns {boolean}
			 */
			const isAttacking = (rowDiff, forwardDirection) => Math.sign(rowDiff) === Math.sign(forwardDirection);
			const calColName = (forwardDirection, is红方, colNum) => {
				if (forwardDirection < 0) {//向上进攻，即玩家在下方，从右数起，列名跟colNum反向
					return is红方 ? 汉语数字[10 - colNum] : 10 - colNum;
				} else {
					return is红方 ? 汉语数字[colNum] : colNum;
				}
			};

			super(gaming, {
				name: '记谱',
				watchers: {
					'玩家选择了单位': ({player, unit}) => {
						const 同名单位行号集 = [];
						const {rowNum, colNum} = unit.position;
						const forwardDirection = this.gaming.battlefield.forwardDirection(player);
						//查看同玩家同列同名单位
						for (let i = 1; i <= this.gaming.battlefield.rowSize; i++) {
							const units = this.gaming.battlefield.getUnitsAt(new 棋盘点位(i, colNum));
							if (units.filter(u => u.name === unit.name && u.owner === player).length) {
								同名单位行号集.push(i);
							}
						}
						const is红方 = player.team.id === 红方id;
						const len = 同名单位行号集.length;
						if (len === 1) {//只有该单位自己
							this.unitName = unit.name + calColName(forwardDirection, is红方, colNum);
						} else {
							同名单位行号集.sort(forwardDirection === -1 ? (a, b) => b - a : (a, b) => a - b);
							const index = 同名单位行号集.indexOf(rowNum);

							if (index === 0) {
								this.unitName = '前' + unit.name;
							} else if (index === len - 1) {
								this.unitName = '后' + unit.name;
							} else if (len === 3) {
								this.unitName = '中' + unit.name;
							} else {
								this.unitName = 汉语数字[index + 1] + unit.name;
							}
						}
					},
					'单位移动': ({unit, oldPosition}) => {
						const newPosition = unit.position;
						const rowDiff = newPosition.rowNum - oldPosition.rowNum;
						const newColNum = newPosition.colNum;
						const is红方 = unit.owner.team.id === 红方id;

						const forwardDirection = this.gaming.battlefield.forwardDirection(unit.owner);
						let moveType;
						let target;

						if (rowDiff === 0) {
							moveType = '平';
							target = calColName(forwardDirection, is红方, newColNum);
						} else {
							moveType = isAttacking(rowDiff, forwardDirection) ? '进' : '退';
							if (newColNum !== oldPosition.colNum) {//行列都不相同，即不是走直线的移动模式。这类模式直接使用落点的列名。
								target = calColName(forwardDirection, is红方, newColNum);
							} else {//直线移动，用移动的步数。
								target = is红方 ? 汉语数字[Math.abs(rowDiff)] : Math.abs(rowDiff);
							}
						}

						const notation = `${this.unitName}${moveType}${target}`;

						if (is红方) {
							this.roundNotations.push([notation]);
						} else {
							if (this.roundNotations) {
								this.roundNotations.at(-1)[1] = notation;
							} else {
								this.roundNotations.push(['', notation]);
							}
						}
					}
				},
				...cfg
			});

			gaming.roundNotations = this.roundNotations;
		}
	}
};