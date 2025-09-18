//=======================================技能

class Move extends Skill {
	constructor(overrideCfg = {}) {
		super({
			name: '移动',
			...overrideCfg,
			watchers: {
				'turn:start': ({player}) => {
					if (player === this.owner.owner) {
						this.gaming.bulletin.watch('玩家选择单位', this.onUnitSelected);
					}
				},
				'turn:end': ({player}) => {
					if (player === this.owner.owner) {
						this.gaming.bulletin.unwatch('玩家选择单位', this.onUnitSelected);
					}
				}
			}
		});
	}

	onUnitSelected = ({unit}) => {
		if (unit === this.owner) {
			let targets = this.getAvailableTargetPositions();
			const eventPayload = {unit: this.owner, availableTargetPositions: targets};
			this.gaming.bulletin.notice('已获取可移动位置集', eventPayload);
			const finalMoves = this.gaming.battlefield.keepValidPositions(eventPayload.availableTargetPositions);
			this.gaming.bulletin.notice('系统更新可用走位', {moves: finalMoves, selectedUnit: this.owner});
		}
	};

	getAvailableTargetPositions() {
		// 默认实现：返回棋盘上所有位置，通常子类会重写
		return Array.from(this.gaming.battlefield.positions.keys());
	}
}

class 横冲直撞 extends Move {
	constructor(cfg) {
		super({name: '横冲直撞', intro: '可以横向或向前移动一格。', ...cfg});
	}

	getAvailableTargetPositions() {
		const {rowNum, colNum} = this.owner.position;
		const forward = this.gaming.battlefield.forwardDirection(this.owner.owner);
		return [
			new 棋盘点位(rowNum + forward, colNum),
			new 棋盘点位(rowNum, colNum - 1),
			new 棋盘点位(rowNum, colNum + 1)
		];
	}
}

const 内置技能集 = {
	'杀敌': class extends Skill {
		constructor(cfg) {
			super({
				name: '杀敌',
				intro: '击败所在位置的敌军',
				tip: '移动到新位置后，吃掉该位置的敌方棋子',
				...cfg,
				watchers: {
					'单位移动': ({unit}) => {
						if (unit === this.owner) {
							this.gaming.battlefield.getUnitsAt(unit.position)
							.filter(e => e !== unit && e.owner.team !== unit.owner.team)
							.forEach(u => {
								this.gaming.battlefield.destroyUnit(u);
								this.gaming.bulletin.notice('单位阵亡', {unit: u, killer: unit});
							});
						}
					}
				}
			});
		}
	},

	'步战四方': class extends Move {
		constructor(cfg) {
			super({name: '步战四方', intro: '可以向前后左右移动一格', tip: '可以向前后左右移动一格。', ...cfg});
		}

		getAvailableTargetPositions() {
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
						if (unit === this.owner) {
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

		getAvailableTargetPositions() {
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

		getAvailableTargetPositions() {
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
					'已获取可移动位置集': ({unit, availableTargetPositions}) => {
						if (unit === this.owner) {
							const {rowNum, colNum} = this.owner.position;
							const filtered = availableTargetPositions.filter(p => {
								const middlePos = new 棋盘点位((p.rowNum + rowNum) / 2, (p.colNum + colNum) / 2);
								return this.gaming.battlefield.getUnitsAt(middlePos).length === 0;
							});
							availableTargetPositions.length = 0;
							availableTargetPositions.push(...filtered);
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
						if (unit === this.owner) {
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

		getAvailableTargetPositions() {
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
					'已获取可移动位置集': ({unit, availableTargetPositions}) => {
						if (unit === this.owner) {
							const {rowNum, colNum} = this.owner.position;
							const filtered = availableTargetPositions.filter(p => {
								const dr = p.rowNum - rowNum;
								const dc = p.colNum - colNum;
								let blockPos;
								if (Math.abs(dr) === 2 && Math.abs(dc) === 1) {
									blockPos = new 棋盘点位(rowNum + dr / 2, colNum);
								} else if (Math.abs(dr) === 1 && Math.abs(dc) === 2) {
									blockPos = new 棋盘点位(rowNum, colNum + dc / 2);
								}
								return !blockPos || this.gaming.battlefield.getUnitsAt(blockPos).length === 0;
							});
							availableTargetPositions.length = 0;
							availableTargetPositions.push(...filtered);
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

		getAvailableTargetPositions() {
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

	'挡我者死':
		class extends Skill {
			constructor(cfg) {
				super({
					name: '挡我者死', intro: '移动路径上的第一个棋子如果是敌方，可以吃掉它。', ...cfg,
					watchers: {
						'已获取可移动位置集': ({unit, availableTargetPositions}) => {
							if (unit !== this.owner) {
								return;
							}

							const myTeam = this.owner.owner.team;
							const {rowNum, colNum} = this.owner.position;
							const {rowSize, colSize} = this.gaming.battlefield;

							const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
							directions.forEach(([dr, dc]) => {
								for (let i = 1; ; i++) {
									const r = rowNum + dr * i;
									const c = colNum + dc * i;
									if (r < 1 || r > rowSize || c < 1 || c > colSize) {
										break;
									}

									const p = new 棋盘点位(r, c);
									const units = this.gaming.battlefield.getUnitsAt(p);
									if (units.length > 0) {
										if (units[0].owner.team !== myTeam) {
											availableTargetPositions.push(p);
										}
										break;
									}
								}
							});
						}
					}
				});
			}
		},

	'隔山打牛': class extends Skill {
		constructor(cfg) {
			super({
				name: '隔山打牛', intro: '可以跳过一个棋子（无论敌我），吃掉路径上的第二个敌方棋子。', ...cfg,
				watchers: {
					'已获取可移动位置集': ({unit, availableTargetPositions}) => {
						if (unit !== this.owner) {
							return;
						}

						const myTeam = this.owner.owner.team;
						const {rowNum, colNum} = this.owner.position;
						const {rowSize, colSize} = this.gaming.battlefield;

						const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
						directions.forEach(([dr, dc]) => {
							let jump = null;
							for (let i = 1; ; i++) {
								const r = rowNum + dr * i;
								const c = colNum + dc * i;
								if (r < 1 || r > rowSize || c < 1 || c > colSize) {
									break;
								}

								const p = new 棋盘点位(r, c);
								const units = this.gaming.battlefield.getUnitsAt(p);

								if (units.length > 0) {
									if (!jump) {
										jump = units[0];
									} else {
										if (units[0].owner.team !== myTeam) {
											availableTargetPositions.push(p);
										}
										break;
									}
								}
							}
						});
					}
				}
			});
		}
	},

	'勇往直前': class extends Move {
		constructor(cfg) {
			super({name: '勇往直前', intro: '只能向前移动一格。', ...cfg});
		}

		getAvailableTargetPositions() {
			const forward = this.gaming.battlefield.forwardDirection(this.owner.owner);
			return [new 棋盘点位(this.owner.position.rowNum + forward, this.owner.position.colNum)];
		}
	},

	'过河卒': class extends Skill {
		constructor(cfg) {
			super({name: '过河卒', intro: '过河之后，可以横向移动。', ...cfg});
			this.watchers['单位移动'] = this.addSkillAfterMove;
		}

		addSkillAfterMove = ({unit}) => {
			if (unit !== this.owner) {
				return;
			}

			const riverCrossed = this.gaming.battlefield.isAcrossRiver(unit.position, unit.owner);

			if (riverCrossed && !this.owner.skills.some(s => s instanceof 横冲直撞)) {
				// 找出所有移动类技能并移除
				const moveSkills = this.owner.skills.filter(s => s instanceof Move);
				moveSkills.forEach(s => this.owner.removeSkill(s));

				// 添加新的移动技能
				this.owner.addSkill(new 横冲直撞({owner: this.owner, gaming: this.gaming}));

				// 此技能已完成使命，可以移除自身
				this.owner.removeSkill(this);
			}
		};
	},

	'横冲直撞': 横冲直撞
};