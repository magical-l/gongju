export class Destructible {
	constructor() {
	}

	takeDamage(damage) {
		this.health -= damage;
		return this.health <= 0;
	}
}
