const 内置插件集 = {
	'记谱': (() => {
		const 汉语数字 = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
		const calColName = (forwardDirection, is红方, colNum) => {
			if (forwardDirection < 0) {
				return is红方 ? 汉语数字[10 - colNum] : 10 - colNum;
			} else {
				return is红方 ? 汉语数字[colNum] : colNum;
			}
		};
		return class extends Plugin {
			unitName;
			roundNotations = [];

			constructor(gaming, cfg) {
				// 监听‘玩家选择了单位’事件，来准备棋谱的上下文（例如：前兵、后炮）
				super(gaming, {
					name: '记谱',
					...cfg,
					watchers: {
						'玩家选择了单位': ({player, unit}) => {
							const 同名单位行号集 = [];
							const {rowNum, colNum} = unit.position;
							const forwardDirection = this.gaming.battlefield.forwardDirection(player);
							for (let i = 1; i <= this.gaming.battlefield.rowSize; i++) {
								const units = this.gaming.battlefield.getUnitsAt(new 棋盘点位(i, colNum));
								if (units.filter(u => u.name === unit.name && u.owner === player).length) {
									同名单位行号集.push(i);
								}
							}
							const is红方 = player.team.id === 红方id;
							const len = 同名单位行号集.length;
							if (len === 1) {
								this.unitName = unit.name + calColName(forwardDirection, is红方, colNum);
							} else {
								同名单位行号集.sort(forwardDirection === -1 ? (a, b) => a - b : (a, b) => b - a);
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
						}
					}
				});

				// 用插件的实现覆盖游戏引擎的默认实现
				gaming._generateNotation = this.generatePluginNotation.bind(this);
				// 清空默认记谱器可能已经添加的内容
				gaming.situation.roundNotations.length = 0;
			}

			generatePluginNotation(move) {
				const isAttacking = (rowDiff, forwardDirection) => Math.sign(rowDiff) === Math.sign(forwardDirection);
				const {unit, oldPosition} = move;
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
					if (newColNum !== oldPosition.colNum) {
						target = calColName(forwardDirection, is红方, newColNum);
					} else {
						target = is红方 ? 汉语数字[Math.abs(rowDiff)] : Math.abs(rowDiff);
					}
				}

				const notation = `${this.unitName}${moveType}${target}`;
				const roundNotations = this.gaming.situation.roundNotations;

				if (is红方) {
					roundNotations.push([notation]);
				} else {
					if (roundNotations.length > 0 && roundNotations.at(-1).length === 1) {
						roundNotations.at(-1).push(notation);
					} else {
						roundNotations.push(['', notation]);
					}
				}
			}
		}
	})()
};