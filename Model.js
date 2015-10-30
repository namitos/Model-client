'use strict';

class Model {
	constructor(properties, options) {
		Object.keys(properties).forEach(function (prop) {
			this[prop] = properties[prop];
		}.bind(this));
		if (options) {
			Object.keys(options).forEach(function (prop) {
				Object.defineProperty(this, prop, {
					value: options[prop]
				});
			}.bind(this));
		}
	}

	toJSON() {
		var result = {};
		Object.keys(this).forEach(function (prop) {
			result[prop] = this[prop];
		}.bind(this));
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
		var model = this;
		return new Promise(function (resolve, reject) {
			model.constructor.sync(
				model.constructor.schema.name,
				model._id ? 'update' : 'create',
				model.toJSON()
			).then(function (result) {
					Object.keys(result).forEach(function (key) {
						model[key] = result[key];
					});
					resolve(model);
				}, function (err) {
					reject(err);
				});
		});
	}

	'delete'() {
		return this.constructor.sync(this.constructor.schema.name, 'delete', this.toJSON());
	}

	static read(where, options, connections) {
		var This = this;
		return This.sync(This.schema.name, 'read', {}, where, options, connections).then(function (loaded) {
			return new Promise(function (resolve, reject) {
				resolve(loaded.map(function (item) {
					var item = new This(item);

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
		var This = this;
		return new Promise(function (resolve, reject) {
			var toSend = {
				collection: collection,
				data: data,
				where: where,
				options: options,
				connections: connections
			};
			This.transport.emit(method, toSend, function (data) {
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
