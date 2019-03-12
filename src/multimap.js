export default class MultiMap {
	constructor () {
		this.root = new Map();
	}
	set (...args) {
		const keys = args.slice(0, -1);
		const value = args[args.length - 1];
		let m = this.root;
		for (let idx = 0; idx < keys.length; idx++) {
			const key = keys[idx];
			const isLast = idx === keys.length - 1;

			if (isLast) {
				m.set(key, value);
				break;
			}
			const c = m;
			m = m.get(key);
			if (!(m instanceof Map)) {
				const map = new Map();
				c.set(key, map);
				m = map;
			}
		}
		return this;
	}
	get (...keys) {
		let m = this.root;
		for (let idx = 0; idx < keys.length; idx++) {
			const key = keys[idx];
			const isLast = idx === keys.length - 1;
			m = m.get(key);
			if (isLast) {
				return m;
			}
			if (!(m instanceof Map)) {
				return;
			}
		}
	}
	delete (...keys) {
		const del = (m, idx = 0) => {
			const key = keys[idx];
			const isLast = idx === keys.length - 1;
			const c = m.get(key);
			if (isLast || (c instanceof Map && del(c, idx + 1))) {
				m.delete(key);
				if (m.size === 0) {
					return true;
				}
				return;
			}
		};
		del(this.root);
	}
}
