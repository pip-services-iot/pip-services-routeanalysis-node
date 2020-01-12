"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const pip_services3_components_node_1 = require("pip-services3-components-node");
const pip_services3_commons_node_1 = require("pip-services3-commons-node");
const RouteAnalysisMongoDbPersistence_1 = require("../persistence/RouteAnalysisMongoDbPersistence");
const RouteAnalysisFilePersistence_1 = require("../persistence/RouteAnalysisFilePersistence");
const RouteAnalysisMemoryPersistence_1 = require("../persistence/RouteAnalysisMemoryPersistence");
const RouteAnalysisController_1 = require("../logic/RouteAnalysisController");
const RouteAnalysisHttpServiceV1_1 = require("../services/version1/RouteAnalysisHttpServiceV1");
class RouteAnalysisServiceFactory extends pip_services3_components_node_1.Factory {
    constructor() {
        super();
        this.registerAsType(RouteAnalysisServiceFactory.MemoryPersistenceDescriptor, RouteAnalysisMemoryPersistence_1.RouteAnalysisMemoryPersistence);
        this.registerAsType(RouteAnalysisServiceFactory.FilePersistenceDescriptor, RouteAnalysisFilePersistence_1.RouteAnalysisFilePersistence);
        this.registerAsType(RouteAnalysisServiceFactory.MongoDbPersistenceDescriptor, RouteAnalysisMongoDbPersistence_1.RouteAnalysisMongoDbPersistence);
        this.registerAsType(RouteAnalysisServiceFactory.ControllerDescriptor, RouteAnalysisController_1.RouteAnalysisController);
        this.registerAsType(RouteAnalysisServiceFactory.HttpServiceDescriptor, RouteAnalysisHttpServiceV1_1.RouteAnalysisHttpServiceV1);
    }
}
exports.RouteAnalysisServiceFactory = RouteAnalysisServiceFactory;
RouteAnalysisServiceFactory.Descriptor = new pip_services3_commons_node_1.Descriptor("pip-services-routeanalysis", "factory", "default", "default", "1.0");
RouteAnalysisServiceFactory.MemoryPersistenceDescriptor = new pip_services3_commons_node_1.Descriptor("pip-services-routeanalysis", "persistence", "memory", "*", "1.0");
RouteAnalysisServiceFactory.FilePersistenceDescriptor = new pip_services3_commons_node_1.Descriptor("pip-services-routeanalysis", "persistence", "file", "*", "1.0");
RouteAnalysisServiceFactory.MongoDbPersistenceDescriptor = new pip_services3_commons_node_1.Descriptor("pip-services-routeanalysis", "persistence", "mongodb", "*", "1.0");
RouteAnalysisServiceFactory.ControllerDescriptor = new pip_services3_commons_node_1.Descriptor("pip-services-routeanalysis", "controller", "default", "*", "1.0");
RouteAnalysisServiceFactory.HttpServiceDescriptor = new pip_services3_commons_node_1.Descriptor("pip-services-routeanalysis", "service", "http", "*", "1.0");
//# sourceMappingURL=RouteAnalysisServiceFactory.js.map