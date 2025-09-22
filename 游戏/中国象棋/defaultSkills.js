class Move extends Skill {
	constructor(overrideCfg = {}) {
		super({
			name: '移动',
			...overrideCfg,
			watchers: {
				'单位杀敌': ({unit, killed}) => {
					if (unit.id === this.owner.id) {
						this.owner.position = killed.position;
					}
				}
			}
		});
	}

	activate(targets) {
		if (!targets || targets.length === 0) {
			return;
		}
		const target = targets[0];
		const position = target instanceof Unit ? target.position : target;

		if (this.isValidTargets([position])) {
			this.owner.position = position;
		}
	}

	_calculateReachablePositions() {
		let rawTargets = this.getRawTargetPositions();
		const eventPayload = {
			unit: this.owner,
			availableTargetPositions: [...rawTargets],
			blockedTargetPositions: []
		};
		this.gaming.bulletin.notice('已获取可移动位置集', eventPayload);
		return {
			valid: this.gaming.battlefield.keepValidPositions(eventPayload.availableTargetPositions),
			blocked: this.gaming.battlefield.keepValidPositions(eventPayload.blockedTargetPositions)
		};
	}

	scopePositions() {
		const {valid, blocked} = this._calculateReachablePositions();
		return valid.concat(blocked);
	}

	get availableTargets() {
		const {valid} = this._calculateReachablePositions();
		return valid.filter(p => this.gaming.battlefield.getUnitsAt(p).length === 0);
	}

	get blockedTargets() {
		return this._calculateReachablePositions().blocked;
	}

	isValidTargets(targets) {
		const available = this.availableTargets || []; //如果availableTargets是undefined，就给一个空数组
		return targets.every(targetPos => {
			const pos = targetPos instanceof Unit ? targetPos.position : targetPos;
			return available.some(p => p.isEqualTo(pos));
		});
	}

	getRawTargetPositions() {
		// 默认实现：返回棋盘上所有位置，通常子类会重写
		return Array.from(this.gaming.battlefield.positions.keys());
	}
}

class 攻击 extends Skill {
	constructor(cfg) {
		super({
			name: '攻击',
			intro: '击败所在位置的敌军',
			tip: '选择敌方单位并将其击败',
			...cfg
		});
	}

	activate(targets) {
		// 假设 targets 是经过验证的、可攻击的敌方单位数组
		(targets || []).forEach(targetUnit => {
			if (targetUnit instanceof Unit && this.availableTargets.includes(targetUnit)) {
				this.gaming.bulletin.notice('单位杀敌', {unit: this.owner, killed: targetUnit});
				this.gaming.battlefield.destroyUnit(targetUnit);
				this.gaming.bulletin.notice('单位阵亡', {unit: targetUnit, killer: this.owner});
			}
		});
	}

	/**
	 * 攻击范围与移动范围一致
	 * @returns {Position[]}
	 */
	scopePositions() {
		const moveSkill = this.owner.skills.find(s => s instanceof Move);
		if (!moveSkill) {
			return [];
		}
		// Move技能的scopePositions应返回所有可到达的位置（无论空否）
		return moveSkill.scopePositions();
	}

	/**
	 * 可攻击的目标是敌方单位
	 * @param {Unit} unit
	 * @returns {boolean}
	 */
	isAvailableTarget(unit) {
		return unit.owner.team.id !== this.owner.owner.team.id;
	}
}

const 内置技能集 = {
	攻击,

	'挡我者死': class extends 攻击 {
		constructor(cfg) {
			super({
				name: '挡我者死',
				intro: '沿直线攻击敌方单位，中间不能有阻碍。',
				tip: '车可以沿直线攻击任何敌方单位，中间不能有其他棋子阻挡。攻击后移动到该位置。',
				...cfg
			});
		}

		scopePositions() {
			const {rowNum, colNum} = this.owner.position;
			const scope = [];
			const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]]; // 上下左右

			directions.forEach(([dr, dc]) => {
				for (let i = 1; ; i++) {
					const r = rowNum + dr * i;
					const c = colNum + dc * i;
					const p = new 棋盘点位(r, c);

					if (!this.gaming.battlefield.isValidPosition(p)) {
						break; // 超出棋盘边界
					}

					scope.push(p);

					const units = this.gaming.battlefield.getUnitsAt(p);
					if (units.length > 0) {
						break; // 遇到任何棋子都阻挡，不能继续向前
					}
				}
			});
			return scope;
		}
	},

	'隔山打牛': class extends 攻击 {
		constructor(cfg) {
			super({
				name: '隔山打牛',
				intro: '隔山打炮，跳过一个棋子攻击敌方单位。',
				tip: '炮可以跳过一个棋子（无论敌我）攻击路径上的第二个敌方棋子。攻击后移动到该位置。',
				...cfg
			});
		}

		scopePositions() {
			const {rowNum, colNum} = this.owner.position;
			const scope = [];
			const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]]; // 上下左右

			directions.forEach(([dr, dc]) => {
				let jumpedOver = false;
				for (let i = 1; ; i++) {
					const r = rowNum + dr * i;
					const c = colNum + dc * i;
					const p = new 棋盘点位(r, c);

					if (!this.gaming.battlefield.isValidPosition(p)) {
						break; // 超出棋盘边界
					}

					const units = this.gaming.battlefield.getUnitsAt(p);
					if (units.length > 0) {
						// 遇到棋子
						if (!jumpedOver) {
							// 第一次遇到棋子，这是炮架
							jumpedOver = true;
						} else {
							// 第二次遇到棋子
							scope.push(p);
							break; // 遇到第二个棋子后，无论敌我，都不能继续向前
						}
					}
				}
			});
			return scope;
		}
	},

	'步战四方': class extends Move {
		constructor(cfg) {
			super({name: '步战四方', intro: '可以向前后左右移动一格', tip: '可以向前后左右移动一格。', ...cfg});
		}

		getRawTargetPositions() {
			const {rowNum, colNum} = this.owner.position;
			return [
				new 棋盘点位(rowNum - 1, colNum), new 棋盘点位(rowNum + 1, colNum),
				new 棋盘点位(rowNum, colNum - 1), new 棋盘点位(rowNum, colNum + 1)
			];
		}
	},

	'守营': class extends Skill {
		constructor(cfg) {
			super({
				name: '守营', intro: '有守卫大营之责，不能冲锋陷阵。', tip: '不能离开九宫格。', ...cfg,
				watchers: {
					'已获取可移动位置集': ({unit, availableTargetPositions}) => {
						if (unit.id === this.owner.id) {
							const filtered = availableTargetPositions.filter(
								p => this.gaming.battlefield.isInPalace(p)
							);
							availableTargetPositions.length = 0;
							availableTargetPositions.push(...filtered);
						}
					}
				}
			});
		}
	},

	'护卫': class extends Move {
		constructor(cfg) {
			super({
				name: '护卫',
				intro: '斜刺里冲出，护卫将帅。',
				tip: '可以向左前方、右前方、左后方、右后方斜线移动至一格对角线方向。', ...cfg
			});
		}

		getRawTargetPositions() {
			const {rowNum, colNum} = this.owner.position;
			return [
				new 棋盘点位(rowNum - 1, colNum - 1), new 棋盘点位(rowNum - 1, colNum + 1),
				new 棋盘点位(rowNum + 1, colNum - 1), new 棋盘点位(rowNum + 1, colNum + 1)
			];
		}
	},

	'象行田': class extends Move {
		constructor(cfg) {
			super({name: '象行田', intro: '走一个“田字形”。', tip: '可移动到斜线两格的位置（‘田字’对角线）。', ...cfg});
		}

		getRawTargetPositions() {
			const {rowNum, colNum} = this.owner.position;
			return [
				new 棋盘点位(rowNum - 2, colNum - 2), new 棋盘点位(rowNum - 2, colNum + 2),
				new 棋盘点位(rowNum + 2, colNum - 2), new 棋盘点位(rowNum + 2, colNum + 2)
			];
		}
	},

	'塞象眼': class extends Skill {
		constructor(cfg) {
			super({
				name: '塞象眼', intro: '如果“田”字中心有棋子，则无法移动过去。', ...cfg,
				watchers: {
					'已获取可移动位置集': ({unit, availableTargetPositions, blockedTargetPositions}) => {
						if (unit.id === this.owner.id) {
							const {rowNum, colNum} = this.owner.position;
							const stillValid = [];
							availableTargetPositions.forEach(p => {
								const middlePos = new 棋盘点位((p.rowNum + rowNum) / 2, (p.colNum + colNum) / 2);
								if (this.gaming.battlefield.getUnitsAt(middlePos).length > 0) {
									blockedTargetPositions.push(p);
								} else {
									stillValid.push(p);
								}
							});
							availableTargetPositions.length = 0;
							availableTargetPositions.push(...stillValid);
						}
					}
				}
			});
		}
	},

	'水太深': class extends Skill {
		constructor(cfg) {
			super({
				name: '水太深', intro: '不能渡过楚河汉界。', tip: '不能过河', ...cfg,
				watchers: {
					'已获取可移动位置集': ({unit, availableTargetPositions}) => {
						if (unit.id === this.owner.id) {
							const filtered = availableTargetPositions.filter(
								p => !this.gaming.battlefield.isAcrossRiver(p, unit.owner)
							);
							availableTargetPositions.length = 0;
							availableTargetPositions.push(...filtered);
						}
					}
				}
			});
		}
	},

	'马行日': class extends Move {
		constructor(cfg) {
			super({name: '马行日', intro: '走一个“日字形”。', tip: '可以移动到“日字”对角线的位置', ...cfg});
		}

		getRawTargetPositions() {
			const {rowNum, colNum} = this.owner.position;
			return [
				new 棋盘点位(rowNum - 2, colNum - 1), new 棋盘点位(rowNum - 2, colNum + 1),
				new 棋盘点位(rowNum + 2, colNum - 1), new 棋盘点位(rowNum + 2, colNum + 1),
				new 棋盘点位(rowNum - 1, colNum - 2), new 棋盘点位(rowNum - 1, colNum + 2),
				new 棋盘点位(rowNum + 1, colNum - 2), new 棋盘点位(rowNum + 1, colNum + 2)
			];
		}
	},

	'绊马脚': class extends Skill {
		constructor(cfg) {
			super({
				name: '绊马脚', intro: '如果前进方向的第一个交叉点有棋子，则无法移动。', ...cfg,
				watchers: {
					'已获取可移动位置集': ({unit, availableTargetPositions, blockedTargetPositions}) => {
						if (unit.id === this.owner.id) {
							const {rowNum, colNum} = this.owner.position;
							const stillValid = [];
							availableTargetPositions.forEach(p => {
								const dr = p.rowNum - rowNum;
								const dc = p.colNum - colNum;
								let blockPos;
								if (Math.abs(dr) === 2 && Math.abs(dc) === 1) {
									blockPos = new 棋盘点位(rowNum + dr / 2, colNum);
								} else if (Math.abs(dr) === 1 && Math.abs(dc) === 2) {
									blockPos = new 棋盘点位(rowNum, colNum + dc / 2);
								}
								if (blockPos && this.gaming.battlefield.getUnitsAt(blockPos).length > 0) {
									blockedTargetPositions.push(p);
								} else {
									stillValid.push(p);
								}
							});
							availableTargetPositions.length = 0;
							availableTargetPositions.push(...stillValid);
						}
					}
				}
			});
		}
	},

	'轮子': class extends Move {
		constructor(cfg) {
			super({name: '轮子', intro: '在没有阻挡的情况下，可以在横向或纵向的任何位置移动。', ...cfg});
		}

		getRawTargetPositions() {
			const {rowNum, colNum} = this.owner.position;
			const {rowSize, colSize} = this.gaming.battlefield;
			const rt = [];
			// 上
			for (let r = rowNum - 1; r >= 1; r--) {
				const p = new 棋盘点位(r, colNum);
				if (this.gaming.battlefield.getUnitsAt(p).length > 0) {
					break;
				}
				rt.push(p);
			}
			// 下
			for (let r = rowNum + 1; r <= rowSize; r++) {
				const p = new 棋盘点位(r, colNum);
				if (this.gaming.battlefield.getUnitsAt(p).length > 0) {
					break;
				}
				rt.push(p);
			}
			// 左
			for (let c = colNum - 1; c >= 1; c--) {
				const p = new 棋盘点位(rowNum, c);
				if (this.gaming.battlefield.getUnitsAt(p).length > 0) {
					break;
				}
				rt.push(p);
			}
			// 右
			for (let c = colNum + 1; c <= colSize; c++) {
				const p = new 棋盘点位(rowNum, c);
				if (this.gaming.battlefield.getUnitsAt(p).length > 0) {
					break;
				}
				rt.push(p);
			}
			return rt;
		}
	},

	'勇往直前': class extends Move {
		constructor(cfg) {
			super({name: '勇往直前', intro: '未过河时只能向前，过河后可横向移动。', ...cfg});
		}

		getRawTargetPositions() {
			const {rowNum, colNum} = this.owner.position;
			const forward = this.gaming.battlefield.forwardDirection(this.owner.owner);
			const rt = [
				new 棋盘点位(rowNum + forward, colNum) // 永远可以向前
			];

			const riverCrossed = this.gaming.battlefield.isAcrossRiver(this.owner.position, this.owner.owner);
			if (riverCrossed) {
				rt.push(new 棋盘点位(rowNum, colNum - 1)); // 向左
				rt.push(new 棋盘点位(rowNum, colNum + 1)); // 向右
			}

			return rt;
		}
	}
};