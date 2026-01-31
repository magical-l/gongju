import {Destructible} from './Destructible.js';

export class Enemy extends Destructible {
	constructor(config, path) {
		super();
		Object.assign(this, config);

		this.id = Date.now() + Math.random();
		this.path = path;
		this.pathIndex = 0;
		this.x = this.path[0].x;
		this.y = this.path[0].y;
		this.maxHealth = this.health;
		this.image = this.image || null;
		this.facing = this.facing || 'right';
		this.direction = 'right';
	}

	update(deltaTime) {
		if (this.pathIndex >= this.path.length - 1) {
			return {reachedEnd: true};
		}

		const target = this.path[this.pathIndex + 1];
		const dx = target.x - this.x;
		const dy = target.y - this.y;
		const distance = Math.sqrt(dx * dx + dy * dy);
		const moveDistance = this.speed * (deltaTime / 16);

		// 根据移动方向设置朝向
		if (Math.abs(dx) > Math.abs(dy)) { // 主要是水平移动
			this.direction = dx < 0 ? 'left' : 'right';
		}

		if (distance < moveDistance) {
			this.x = target.x;
			this.y = target.y;
			this.pathIndex++;
		} else {
			this.x += (dx / distance) * moveDistance;
			this.y += (dy / distance) * moveDistance;
		}
		return {reachedEnd: false};
	}
}
