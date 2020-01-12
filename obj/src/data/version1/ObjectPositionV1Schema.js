"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const pip_services3_commons_node_1 = require("pip-services3-commons-node");
const pip_services3_commons_node_2 = require("pip-services3-commons-node");
class ObjectPositionV1Schema extends pip_services3_commons_node_1.ObjectSchema {
    constructor() {
        super();
        this.withRequiredProperty('org_id', pip_services3_commons_node_2.TypeCode.String);
        this.withRequiredProperty('object_id', pip_services3_commons_node_2.TypeCode.String);
        this.withRequiredProperty('time', pip_services3_commons_node_2.TypeCode.DateTime);
        this.withRequiredProperty('lat', pip_services3_commons_node_2.TypeCode.Float);
        this.withRequiredProperty('lng', pip_services3_commons_node_2.TypeCode.Float);
        this.withOptionalProperty('alt', pip_services3_commons_node_2.TypeCode.Float);
        this.withOptionalProperty('speed', pip_services3_commons_node_2.TypeCode.Float);
        this.withOptionalProperty('angle', pip_services3_commons_node_2.TypeCode.Float);
    }
}
exports.ObjectPositionV1Schema = ObjectPositionV1Schema;
//# sourceMappingURL=ObjectPositionV1Schema.js.map