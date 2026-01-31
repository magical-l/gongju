import {AimerFactory} from './aimer.js';

export class Tower {
	constructor(config, x, y, aimerType = 'earliest', cellSize = 50, baseCellSize = 40) {
		Object.assign(this, config);

		this.id = Date.now() + Math.random();
		this.x = x;
		this.y = y;
		this.cellSize = cellSize;
		this.fireCountdown = 0;
		this.aimerType = aimerType;
		this.aimer = AimerFactory.create(aimerType);

		if (!this.rangeInCells) {
			// If only pixel range is provided, calculate rangeInCells based on the BASE grid size.
			this.rangeInCells = this.range / baseCellSize;
		}

		// Now, calculate the final pixel range based on the current cell size.
		this.range = this.rangeInCells * this.cellSize;
	}

	// 更新范围以适应新的缩放
	updateRange(cellSize) {
		this.cellSize = cellSize;
		this.range = this.rangeInCells * cellSize;
	}

	update(deltaTime, enemies, obstacles, bullets, lockedTargetId) {
		this.fireCountdown -= deltaTime;
		if (this.fireCountdown <= 0) {
			const target = this.findTarget(enemies, obstacles, lockedTargetId);
			if (target) {
				bullets.push({
					id: Date.now() + Math.random(),
					x: this.x,
					y: this.y,
					target: target,
					speed: this.bulletSpeed,
					damage: this.damage,
				});
				this.fireCountdown = this.fireRate;
			}
		}
	}

	findTarget(enemies, obstacles, lockedTargetId) {
		// 1. 优先攻击锁定目标
		if (lockedTargetId) {
			const lockedTarget = [...enemies, ...obstacles].find(t => t.id === lockedTargetId);
			if (lockedTarget) {
				const distance = Math.sqrt((lockedTarget.x - this.x) ** 2 + (lockedTarget.y - this.y) ** 2);
				if (distance < this.range) {
					return lockedTarget; // 如果锁定目标在范围内，优先攻击
				}
			}
		}

		// 2. 使用瞄准器系统选择目标（只自动瞄准敌人，不瞄准障碍物）
		return this.aimer.aim(enemies, obstacles, this.range, this.x, this.y);
	}
}
