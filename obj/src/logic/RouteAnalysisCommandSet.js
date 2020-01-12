"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const pip_services3_commons_node_1 = require("pip-services3-commons-node");
const pip_services3_commons_node_2 = require("pip-services3-commons-node");
const pip_services3_commons_node_3 = require("pip-services3-commons-node");
const pip_services3_commons_node_4 = require("pip-services3-commons-node");
const pip_services3_commons_node_5 = require("pip-services3-commons-node");
const pip_services3_commons_node_6 = require("pip-services3-commons-node");
const pip_services3_commons_node_7 = require("pip-services3-commons-node");
const pip_services3_commons_node_8 = require("pip-services3-commons-node");
const pip_services3_commons_node_9 = require("pip-services3-commons-node");
const ObjectPositionV1Schema_1 = require("../data/version1/ObjectPositionV1Schema");
class RouteAnalysisCommandSet extends pip_services3_commons_node_1.CommandSet {
    constructor(logic) {
        super();
        this._logic = logic;
        // Register commands to the database
        this.addCommand(this.makeGetCurrentRoutesCommand());
        this.addCommand(this.makeGetCurrentRouteCommand());
        this.addCommand(this.makeAddPositionCommand());
        this.addCommand(this.makeAddPositionsCommand());
    }
    makeGetCurrentRoutesCommand() {
        return new pip_services3_commons_node_2.Command("get_current_routes", new pip_services3_commons_node_5.ObjectSchema(true)
            .withOptionalProperty('filter', new pip_services3_commons_node_8.FilterParamsSchema())
            .withOptionalProperty('paging', new pip_services3_commons_node_9.PagingParamsSchema()), (correlationId, args, callback) => {
            let filter = pip_services3_commons_node_3.FilterParams.fromValue(args.get("filter"));
            let paging = pip_services3_commons_node_4.PagingParams.fromValue(args.get("paging"));
            this._logic.getCurrentRoutes(correlationId, filter, paging, callback);
        });
    }
    makeGetCurrentRouteCommand() {
        return new pip_services3_commons_node_2.Command("get_current_route", new pip_services3_commons_node_5.ObjectSchema(true)
            .withRequiredProperty('object_id', pip_services3_commons_node_7.TypeCode.String)
            .withOptionalProperty('from_time', null) // TypeCode.Date
            .withOptionalProperty('to_time', null) // TypeCode.DateTime
            .withOptionalProperty('compress', pip_services3_commons_node_7.TypeCode.Long), (correlationId, args, callback) => {
            let objectId = args.getAsNullableString("object_id");
            let fromTime = args.getAsNullableDateTime("from_time");
            let toTime = args.getAsNullableDateTime("to_time");
            this._logic.getCurrentRoute(correlationId, objectId, fromTime, toTime, callback);
        });
    }
    makeAddPositionCommand() {
        return new pip_services3_commons_node_2.Command("add_position", new pip_services3_commons_node_5.ObjectSchema(true)
            .withRequiredProperty('position', new ObjectPositionV1Schema_1.ObjectPositionV1Schema()), (correlationId, args, callback) => {
            let position = args.get("position");
            this._logic.addPosition(correlationId, position, (err) => {
                if (callback)
                    callback(err, null);
            });
        });
    }
    makeAddPositionsCommand() {
        return new pip_services3_commons_node_2.Command("add_positions", new pip_services3_commons_node_5.ObjectSchema(true)
            .withRequiredProperty('positions', new pip_services3_commons_node_6.ArraySchema(new ObjectPositionV1Schema_1.ObjectPositionV1Schema())), (correlationId, args, callback) => {
            let positions = args.get("positions");
            this._logic.addPositions(correlationId, positions, (err) => {
                if (callback)
                    callback(err, null);
            });
        });
    }
}
exports.RouteAnalysisCommandSet = RouteAnalysisCommandSet;
//# sourceMappingURL=RouteAnalysisCommandSet.js.map