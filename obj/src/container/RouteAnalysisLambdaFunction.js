"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const pip_services3_commons_node_1 = require("pip-services3-commons-node");
const pip_services3_aws_node_1 = require("pip-services3-aws-node");
const pip_clients_routes_node_1 = require("pip-clients-routes-node");
const RouteAnalysisServiceFactory_1 = require("../build/RouteAnalysisServiceFactory");
class RouteAnalysisLambdaFunction extends pip_services3_aws_node_1.CommandableLambdaFunction {
    constructor() {
        super("route_analysis", "Route analysis function");
        this._dependencyResolver.put('controller', new pip_services3_commons_node_1.Descriptor('pip-services-routeanalysis', 'controller', 'default', '*', '*'));
        this._factories.add(new RouteAnalysisServiceFactory_1.RouteAnalysisServiceFactory());
        this._factories.add(new pip_clients_routes_node_1.RoutesClientFactory());
    }
    getReferences() {
        return this._references;
    }
}
exports.RouteAnalysisLambdaFunction = RouteAnalysisLambdaFunction;
exports.handler = new RouteAnalysisLambdaFunction().getHandler();
//# sourceMappingURL=RouteAnalysisLambdaFunction.js.map