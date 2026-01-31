// 瞄准器基类
class Aimer {
	constructor(name) {
		this.name = name;
	}

	// 基础瞄准方法，子类需要重写
	aim(enemies, obstacles, range, towerX, towerY) {
		throw new Error('Subclass must implement aim method');
	}

	// 计算距离的辅助方法
	calculateDistance(x1, y1, x2, y2) {
		return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
	}

	// 过滤在范围内的敌人
	getEnemiesInRange(enemies, range, towerX, towerY) {
		return enemies.filter(enemy => {
			const distance = this.calculateDistance(enemy.x, enemy.y, towerX, towerY);
			return distance < range;
		});
	}
}

// a. 登场最早的敌人瞄准器
class EarliestEnemyAimer extends Aimer {
	constructor() {
		super('登场最早');
	}

	aim(enemies, obstacles, range, towerX, towerY) {
		const enemiesInRange = this.getEnemiesInRange(enemies, range, towerX, towerY);
		if (enemiesInRange.length === 0) {
			return null;
		}

		// 按ID排序，ID越小表示登场越早
		return enemiesInRange.reduce((earliest, current) =>
			current.id < earliest.id ? current : earliest,
		);
	}
}

// b. 最近的敌人瞄准器
class ClosestEnemyAimer extends Aimer {
	constructor() {
		super('最近敌人');
	}

	aim(enemies, obstacles, range, towerX, towerY) {
		const enemiesInRange = this.getEnemiesInRange(enemies, range, towerX, towerY);
		if (enemiesInRange.length === 0) {
			return null;
		}

		let closest = null;
		let minDistance = range;

		for (const enemy of enemiesInRange) {
			const distance = this.calculateDistance(enemy.x, enemy.y, towerX, towerY);
			if (distance < minDistance) {
				minDistance = distance;
				closest = enemy;
			}
		}
		return closest;
	}
}

// c. 最远的敌人瞄准器
class FarthestEnemyAimer extends Aimer {
	constructor() {
		super('最远敌人');
	}

	aim(enemies, obstacles, range, towerX, towerY) {
		const enemiesInRange = this.getEnemiesInRange(enemies, range, towerX, towerY);
		if (enemiesInRange.length === 0) {
			return null;
		}

		let farthest = null;
		let maxDistance = 0;

		for (const enemy of enemiesInRange) {
			const distance = this.calculateDistance(enemy.x, enemy.y, towerX, towerY);
			if (distance > maxDistance) {
				maxDistance = distance;
				farthest = enemy;
			}
		}
		return farthest;
	}
}

// d. 速度最快的敌人瞄准器
class FastestEnemyAimer extends Aimer {
	constructor() {
		super('速度最快');
	}

	aim(enemies, obstacles, range, towerX, towerY) {
		const enemiesInRange = this.getEnemiesInRange(enemies, range, towerX, towerY);
		if (enemiesInRange.length === 0) {
			return null;
		}

		return enemiesInRange.reduce((fastest, current) =>
			current.speed > fastest.speed ? current : fastest,
		);
	}
}

// e. 速度最慢的敌人瞄准器
class SlowestEnemyAimer extends Aimer {
	constructor() {
		super('速度最慢');
	}

	aim(enemies, obstacles, range, towerX, towerY) {
		const enemiesInRange = this.getEnemiesInRange(enemies, range, towerX, towerY);
		if (enemiesInRange.length === 0) {
			return null;
		}

		return enemiesInRange.reduce((slowest, current) =>
			current.speed < slowest.speed ? current : slowest,
		);
	}
}

// f. 血量最少的敌人瞄准器
class LowestHealthEnemyAimer extends Aimer {
	constructor() {
		super('血量最少');
	}

	aim(enemies, obstacles, range, towerX, towerY) {
		const enemiesInRange = this.getEnemiesInRange(enemies, range, towerX, towerY);
		if (enemiesInRange.length === 0) {
			return null;
		}

		return enemiesInRange.reduce((lowest, current) =>
			current.health < lowest.health ? current : lowest,
		);
	}
}

// g. 血量最多的敌人瞄准器
class HighestHealthEnemyAimer extends Aimer {
	constructor() {
		super('血量最多');
	}

	aim(enemies, obstacles, range, towerX, towerY) {
		const enemiesInRange = this.getEnemiesInRange(enemies, range, towerX, towerY);
		if (enemiesInRange.length === 0) {
			return null;
		}

		return enemiesInRange.reduce((highest, current) =>
			current.health > highest.health ? current : highest,
		);
	}
}

// 瞄准器工厂
export class AimerFactory {
	static aimerTypes = {
		'earliest': () => new EarliestEnemyAimer(),
		'closest': () => new ClosestEnemyAimer(),
		'farthest': () => new FarthestEnemyAimer(),
		'fastest': () => new FastestEnemyAimer(),
		'slowest': () => new SlowestEnemyAimer(),
		'lowest_health': () => new LowestHealthEnemyAimer(),
		'highest_health': () => new HighestHealthEnemyAimer(),
	};

	static create(type) {
		const factory = this.aimerTypes[type];
		if (!factory) {
			throw new Error(`Unknown aimer type: ${type}`);
		}
		return factory();
	}

	static getAvailableTypes() {
		return Object.keys(this.aimerTypes);
	}

	static getTypeNames() {
		return {
			'earliest': '登场最早',
			'closest': '最近敌人',
			'farthest': '最远敌人',
			'fastest': '速度最快',
			'slowest': '速度最慢',
			'lowest_health': '血量最少',
			'highest_health': '血量最多',
		};
	}
}