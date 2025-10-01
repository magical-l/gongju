import {addCfgProps, aopMethod, compareWithId, ensureArray, unwatch, watch, watchersWatch} from './kit.esm.js';
import {Command, Module, PassiveSkill, Player, SkillHolder} from './turn-based-game.esm.js';

export {
	Unit, BuffSkill, UnitModule, SelectUnitCommand,
};

class SelectUnitCommand extends Command {
	constructor(player, units) {
		super(player);
		this.units = units;
	}

	async execute() {
		this.player.selectUnits(this.units);
		return false; //选择不是消费行为，所以返回false
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
		aopMethod(this, 'addSkill', {
			noticePayloadBuilder: args => ({skillHolder: this, skill: args[0]}),
		});
		aopMethod(this, 'removeSkill', {
			noticePayloadBuilder: args => ({skillHolder: this, skill: args[0]}),
		});

		const skills = this._buildSkills(cfg.skills || []);
		skills.forEach(skill => this.addSkill(skill));
	}
}

Object.assign(Unit.prototype, SkillHolder);

class BuffSkill extends PassiveSkill {
	_isActivated = false;

	constructor(cfg, owner) {
		super(cfg, owner);

		const rawActivate = this.activate;
		this.activate = async (...args) => {
			if (this._isActivated) {
				console?.warn(`BuffSkill [${this.name}] 已经激活过一次，不能再次主动使用。`);
				return false;
			}
			const result = await rawActivate.apply(this, args);
			if (result === true) {
				this._isActivated = true;
			}
			return result;
		};

		const rawFilterValidTargets = this.filterValidTargets;
		this.filterValidTargets = (...args) => {
			if (this._isActivated) {
				console?.warn(`BuffSkill [${this.name}] 已经激活过一次，因此不返回任何合法目标。`);
				return [];
			}
			return rawFilterValidTargets.apply(this, args);
		};

		const activateAfterAddSkill = ({skillHolder, skill}) => {
			if (compareWithId(this.owner, skillHolder) && compareWithId(this, skill)) {
				this.activate(this.owner);
				watch(this, '* removeSkill end', ({unit, skill}) => {
					if (compareWithId(this.owner, unit) && compareWithId(this, skill)) {
						this.deactivate();
						unwatch(this, '* addSkill end', activateAfterAddSkill);
					}
				});
			}
		};
		watchersWatch(this, {
			'* addSkill end': activateAfterAddSkill,
		});
	}

	filterValidTargets(targets) {
		const processedTargets = ensureArray(targets);
		return processedTargets.filter(t => compareWithId(t, this.owner));
	}

	async deactivate() { return true; }
}

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
