"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const pip_services3_container_node_1 = require("pip-services3-container-node");
const pip_services3_rpc_node_1 = require("pip-services3-rpc-node");
const pip_clients_routes_node_1 = require("pip-clients-routes-node");
const RouteAnalysisServiceFactory_1 = require("../build/RouteAnalysisServiceFactory");
class RouteAnalysisProcess extends pip_services3_container_node_1.ProcessContainer {
    constructor() {
        super("route_analysis", "Route analysis microservice");
        this._factories.add(new RouteAnalysisServiceFactory_1.RouteAnalysisServiceFactory);
        this._factories.add(new pip_clients_routes_node_1.RoutesClientFactory());
        this._factories.add(new pip_services3_rpc_node_1.DefaultRpcFactory);
    }
}
exports.RouteAnalysisProcess = RouteAnalysisProcess;
//# sourceMappingURL=RouteAnalysisProcess.js.map