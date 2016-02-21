'use strict';

class Model {
	constructor(properties, options) {
		properties = properties || {};
		Object.keys(properties).forEach((prop) => {
			this[prop] = properties[prop];
		});
		if (options) {
			Object.keys(options).forEach((prop) => {
				Object.defineProperty(this, prop, {
					value: options[prop]
				});
			});
		}
	}

	toJSON() {
		var result = {};
		Object.keys(this).forEach((prop) => {
			result[prop] = this[prop];
		});
		return result;
	}

	/**
	 * возвращает связи. если передан аргумент, то конкретную связь
	 * @param connName
	 */
	conns(connName) {
		if (this.connections[connName]) {
			return this.connections[connName];
		}
	}

	/**
	 * возвращает первый объект из связей, если он есть
	 * @param connName
	 */
	conn(connName) {
		if (this.connections[connName] && this.connections[connName][0]) {
			return this.connections[connName][0];
		} else {
			return false;
		}
	}

	save() {
		return new Promise((resolve, reject) => {
			this.constructor.sync(
				this.constructor.schema.name,
				this._id ? 'update' : 'create',
				this.toJSON()
			).then((result) => {
				Object.keys(result).forEach((key) => {
					this[key] = result[key];
				});
				resolve(this);
			}, (err) => {
				reject(err);
			});
		});
	}

	'delete'() {
		return this.constructor.sync(this.constructor.schema.name, 'delete', this.toJSON());
	}

	/**
	 * useful wrapper for getting values of deep objects
	 * @param path
	 * @returns {*}
	 */
	get(path) {
		return _.get(this, path);
	}

	/**
	 * useful wrapper for setting values of deep objects
	 * @param path
	 * @returns {Object}
	 */
	set(path) {
		return _.set(this, path);
	}

	static read(where, options, connections) {
		return this.sync(this.schema.name, 'read', {}, where, options, connections).then((loaded) => {
			return new Promise((resolve, reject) => {
				resolve(loaded.map((item) => {
					var item = new this(item);

					if (item.connections) {
						var connections = item.connections;
						delete item.connections;
						Object.defineProperty(item, 'connections', {
							value: connections
						});
					}

					return item;
				}));
			});
		});
	}

	static sync(collection, method, data, where, options, connections) {
		return new Promise((resolve, reject) => {
			var toSend = {
				collection: collection,
				data: data,
				where: where,
				options: options,
				connections: connections
			};
			this.transport.emit('data:' + method, toSend, (data) => {
				if (data.hasOwnProperty('error')) {
					reject(data.error);
				} else {
					resolve(data);
				}
			});
		});
	}

	static get transport() {
		return window.socket;
	}

	static get schema() {
		//в наследуемых объектах надо определять геттер схемы
	}

}

class Schema {
	constructor(schema) {
		schema = schema || {};
		if (schema.type == 'object') {
			Object.keys(schema).forEach((prop) => {
				this[prop] = schema[prop];
			});
		} else if (schema.type == 'array') {

		}
	}

	forEach(fn, schema) {
		schema = schema || this;
		fn(schema);
		if (schema.type == 'object') {
			Object.keys(schema.properties).forEach((key) => {
				this.forEach(fn, schema.properties[key]);
			});
		} else if (schema.type == 'array') {
			this.forEach(fn, schema.items);
		}
	}

	getField(path, property) {
		var schemaPath = _.flatMap(path.split('.'), (part) => {
			return ['properties', part];
		});
		var field = _.get(this, schemaPath.join('.'));
		return field && property ? field[property] : field;
	}
}
