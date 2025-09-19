const 内置规则集 = {
	'王不见王': class extends Rule {
		constructor(gaming, cfg) {
			super(gaming, {
				name: '王不见王', intro: '将帅不能碰见对方将帅，否则输棋。', tip: '将帅不能位于同一列且中间无其他棋子遮挡。',
				watchers: {
					'inited': () => {
						// 从Player的单位列表中获取所有单位，而不是从棋盘的映射中
						const allUnits = this.gaming.teamList.flatMap(team => Object.values(team.players)).flatMap(player => player.units);
						this.kingRed = allUnits.find(u => u.name === '帅');
						this.kingBlack = allUnits.find(u => u.name === '将');
					},
					'单位阵亡': ({unit}) => {
						if (unit === this.kingRed) {
							this.kingRed = null;
						}
						if (unit === this.kingBlack) {
							this.kingBlack = null;
						}
					},
					'已获取可移动位置集': ({unit, availableTargetPositions}) => {
						// 任何棋子移动后，都不能造成将帅对面的情况
						if (!this.kingRed || !this.kingBlack) {
							return; // 将帅不齐，不检查
						}

						const filteredPositions = availableTargetPositions.filter(targetPos => {
							const battlefield = this.gaming.battlefield;
							const movingUnit = unit;
							const fromPos = movingUnit.position;

							// 如果目标位置是对方将帅，则此规则不应阻止将军或绝杀
							if (targetPos.isEqualTo(this.kingRed.position) || targetPos.isEqualTo(this.kingBlack.position)) {
								return true;
							}

							// 推算移动后的将帅位置
							const futureKingRedPos = movingUnit === this.kingRed ? targetPos : this.kingRed.position;
							const futureKingBlackPos = movingUnit === this.kingBlack ? targetPos : this.kingBlack.position;

							// 如果移动后将帅不在同一列，则移动合法
							if (futureKingRedPos.colNum !== futureKingBlackPos.colNum) {
								return true;
							}

							// 如果在同一列，则检查两者之间是否有其他棋子
							const col = futureKingRedPos.colNum;
							const minRow = Math.min(futureKingRedPos.rowNum, futureKingBlackPos.rowNum);
							const maxRow = Math.max(futureKingRedPos.rowNum, futureKingBlackPos.rowNum);

							for (let r = minRow + 1; r < maxRow; r++) {
								const p = new 棋盘点位(r, col);

								// 如果有棋子要移动到将帅之间的位置，该移动合法，因为移动的棋子本身会成为遮挡物
								if (targetPos.isEqualTo(p)) {
									return true;
								}

								// 如果有棋子正从将帅之间的位置移开
								if (fromPos && fromPos.isEqualTo(p)) {
									// 如果该位置上还有其他棋子（虽然中国象棋里不常见），则移动合法
									if (battlefield.getUnitsAt(p).length > 1) {
										return true;
									}
									// 否则，该位置变为空，相当于少了一个遮挡物，继续检查下一行
								} else {
									// 检查棋盘上本来就在那里的棋子
									if (battlefield.getUnitsAt(p).length > 0) {
										return true; // 发现遮挡物，移动合法
									}
								}
							}

							// 遍历结束，未发现任何遮挡物，故移动非法
							return false;
						});

						// 用过滤后的结果替换原可移动位置列表
						availableTargetPositions.length = 0;
						availableTargetPositions.push(...filteredPositions);
					}
				},
				...cfg
			});
		}
	},

	'斩将': class extends Rule {
		constructor(gaming, cfg) {
			super(gaming, {
				name: '斩将', intro: '将帅阵亡则输棋。', tip: '保护好将帅。',
				watchers: {
					'单位阵亡': ({unit, killer}) => {
						if (unit.name === '将' || unit.name === '帅') {
							gaming.bulletin.notice('game:over', {winner: killer.owner});
						}
					}
				},
				...cfg
			});
		}
	},

	'不能叠加棋子': class extends Rule {
		constructor(gaming, cfg) {
			super(gaming, {
				name: '不能叠加棋子',
				intro: '棋子不能移动到已有己方棋子的位置。',
				...cfg,
				watchers: {
					'已获取可移动位置集': ({unit, availableTargetPositions}) => {
						if (!unit) {
							return;
						}
						const myTeam = unit.owner.team;
						const filtered = availableTargetPositions.filter(p => {
							const unitsAtTarget = this.gaming.battlefield.getUnitsAt(p);
							return unitsAtTarget.length === 0 || unitsAtTarget[0].owner.team !== myTeam;
						});
						availableTargetPositions.length = 0;
						availableTargetPositions.push(...filtered);
					}
				}
			});
		}
	}
};