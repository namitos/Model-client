'use strict';

class Tree extends Model {
	static breadcrumb(id) {
		return this.sync(this.schema.name, 'breadcrumb', {}, {
			_id: id
		}).then((loaded) => {
			return loaded.map((obj) => {
				var item = new this(obj);
				if (item.connections) {
					var connections = item.connections;
					delete item.connections;
					Object.defineProperty(item, 'connections', {
						value: connections
					});
				}
				return item;
			});
		});
	}
}