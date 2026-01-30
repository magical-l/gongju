/**
 * 星连星 1-based 求解器
 * 蓝(1,1)-(5,3) 红(2,2)-(4,4) 绿(1,4)-(1,5)  3色5x5
 */
const R = 5, C = 5;
const GREEN = [[1, 4], [1, 5]];
const BLUE_START = [1, 1], BLUE_END = [5, 3];
const RED_START = [2, 2], RED_END = [4, 4];

function key(r, c) { return `${r},${c}`; }

function parseKey(k) {
	const [r, c] = k.split(',').map(Number);
	return [r, c];
}

const GREEN_SET = new Set(GREEN.map(([r, c]) => key(r, c)));

function* adj(r, c) {
	if (r > 1) {
		yield [r - 1, c];
	}
	if (r < R) {
		yield [r + 1, c];
	}
	if (c > 1) {
		yield [r, c - 1];
	}
	if (c < C) {
		yield [r, c + 1];
	}
}

// 枚举从 start 到 end 恰好覆盖 cells 的哈密顿路径（DFS）
function findHamiltonian(start, end, cellsSet) {
	const cells = [...cellsSet].map(parseKey);
	if (cells.length === 0) {
		return null;
	}
	const startK = key(start[0], start[1]);
	const endK = key(end[0], end[1]);
	if (!cellsSet.has(startK) || !cellsSet.has(endK)) {
		return null;
	}

	function dfs(path, used) {
		const [r, c] = path[path.length - 1];
		if (path.length === cells.length) {
			if (r === end[0] && c === end[1]) {
				return path;
			}
			return null;
		}
		for (const [nr, nc] of adj(r, c)) {
			const k = key(nr, nc);
			if (!cellsSet.has(k) || used.has(k)) {
				continue;
			}
			used.add(k);
			path.push([nr, nc]);
			const res = dfs(path, used);
			if (res) {
				return res;
			}
			path.pop();
			used.delete(k);
		}
		return null;
	}

	const used = new Set([startK]);
	return dfs([[start[0], start[1]]], used);
}

// 枚举蓝线：从 (1,1) 到 (5,3) 长度 7 的路径（步数 6）
function* bluePaths() {
	const BLUE_LEN = 7;
	const used = new Set([key(1, 1)]);
	used.add(key(1, 4));
	used.add(key(1, 5)); // 绿

	function* dfs(path) {
		const [r, c] = path[path.length - 1];
		if (path.length === BLUE_LEN) {
			if (r === BLUE_END[0] && c === BLUE_END[1]) {
				yield path.map(x => [...x]);
			}
			return;
		}
		for (const [nr, nc] of adj(r, c)) {
			const k = key(nr, nc);
			if (used.has(k)) {
				continue;
			}
			used.add(k);
			path.push([nr, nc]);
			yield* dfs(path);
			path.pop();
			used.delete(k);
		}
	}

	yield* dfs([[1, 1]]);
}

// 枚举所有蓝线（(1,1)->(5,3) 共7格），对每种检查红线是否有哈密顿路径
let count = 0;
let found = false;
for (const bluePath of bluePaths()) {
	count++;
	const bs = new Set(bluePath.map(([r, c]) => key(r, c)));
	const rc = new Set();
	for (let r = 1; r <= R; r++) {
		for (let c = 1; c <= C; c++) {
			const k = key(r, c);
			if (GREEN_SET.has(k) || bs.has(k)) {
				continue;
			}
			rc.add(k);
		}
	}
	if (rc.size !== 16) {
		continue;
	}
	const rp = findHamiltonian(RED_START, RED_END, rc);
	if (rp) {
		console.log('绿线: (1,4) -> (1,5)');
		console.log('蓝线（7格）:', bluePath.map(([r, c]) => `(${r},${c})`).join(' -> '));
		console.log('红线（16格）:', rp.map(([r, c]) => `(${r},${c})`).join(' -> '));
		found = true;
		break;
	}
}
console.log('(共枚举', count, '条蓝线)');
if (!found) {
	console.log('结论: 该星位布局无解。');
}
