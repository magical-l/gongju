import {Destructible} from './Destructible.js';

export class Obstacle extends Destructible {
	constructor(config, cellSize) {
		super();
		Object.assign(this, config);

		this.x = this.gridX * cellSize + cellSize / 2;
		this.y = this.gridY * cellSize + cellSize / 2;
		this.maxHealth = this.health;
	}
}
