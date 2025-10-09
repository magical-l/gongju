import {addCfgProps, aopMethod, compareWithId} from './kit.esm.js';
import {Command, Module, Player, SkillHolder} from './turn-based-game.esm.js';

export {
	Unit, UnitModule, SelectUnitCommand,
};

class SelectUnitCommand extends Command {
	constructor(player, units) {
		super(player);
		this.units = units;
	}

	async execute() {
		this.player.selectUnits(this.units);
		return {actionsConsumed: 0, changes: []}; //选择不是消费行为，所以返回false
	}
}

class Unit {
	static _nextId = 1;

	_cfg;

	get display() { return this._cfg.display ?? this.name; }

	get gaming() { return this.owner?.gaming; }

	_id;
	get id() { return this._id; }

	_skills = [];
	get skills() { return [...this._skills]; }

	_skillBoundWatchers = new WeakMap();

	constructor(cfg) {
		this._cfg = cfg;
		this._id = 'id' in cfg ? cfg.id : Unit._nextId++;

		addCfgProps(this, this._cfg);
		this._initializeSkills(cfg);
	}
}

Object.assign(Unit.prototype, SkillHolder);

class UnitModule extends Module {
	constructor(gaming, cfg) {
		super(gaming, cfg);
		this._upgradePlayerClass();
		gaming.playerTurnSequence.forEach(player => {
			this._applyAopToPlayer(player);
			if (player.units === undefined) {
				player.units = [];
			}
			if (player.selectedUnits === undefined) {
				player.selectedUnits = [];
			}
		});
	}

	_applyAopToPlayer(player) {
		if (player._unitBasedAopApplied) {
			return;
		}
		aopMethod(player, 'addUnit', {noticePayloadBuilder: args => ({unit: args[0]})});
		aopMethod(player, 'removeUnit', {noticePayloadBuilder: args => ({unit: args[0]})});
		aopMethod(player, 'selectUnits', {noticePayloadBuilder: args => ({units: args[0]})});
		player._unitBasedAopApplied = true;
	}

	_upgradePlayerClass() {
		if (Player.prototype._unitBasedUpgraded) {
			return;
		}
		Player.prototype._unitBasedUpgraded = true;

		Player.prototype.addUnit = function(unit) {
			this.units.push(unit);
		};
		Player.prototype.removeUnit = function(unit) {
			const index = this.units.findIndex(e => compareWithId(e, unit));
			if (index > -1) {
				this.units.splice(index, 1);
			}
		};

		Player.prototype.selectUnits = function(units) {
			const ownUnits = units.filter(u => compareWithId(u.owner, this));
			if (ownUnits.length > 0) {
				this.selectedUnits = ownUnits;
				this.selectedSkills = [];
				this.selectedTargets = [];
			}
		};
	}
}
