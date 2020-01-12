import { Factory } from 'pip-services3-components-node';
import { Descriptor } from 'pip-services3-commons-node';

import { RouteAnalysisMongoDbPersistence } from '../persistence/RouteAnalysisMongoDbPersistence';
import { RouteAnalysisFilePersistence } from '../persistence/RouteAnalysisFilePersistence';
import { RouteAnalysisMemoryPersistence } from '../persistence/RouteAnalysisMemoryPersistence';
import { RouteAnalysisController } from '../logic/RouteAnalysisController';
import { RouteAnalysisHttpServiceV1 } from '../services/version1/RouteAnalysisHttpServiceV1';

export class RouteAnalysisServiceFactory extends Factory {
	public static Descriptor = new Descriptor("pip-services-routeanalysis", "factory", "default", "default", "1.0");
	public static MemoryPersistenceDescriptor = new Descriptor("pip-services-routeanalysis", "persistence", "memory", "*", "1.0");
	public static FilePersistenceDescriptor = new Descriptor("pip-services-routeanalysis", "persistence", "file", "*", "1.0");
	public static MongoDbPersistenceDescriptor = new Descriptor("pip-services-routeanalysis", "persistence", "mongodb", "*", "1.0");
	public static ControllerDescriptor = new Descriptor("pip-services-routeanalysis", "controller", "default", "*", "1.0");
	public static HttpServiceDescriptor = new Descriptor("pip-services-routeanalysis", "service", "http", "*", "1.0");
	
	constructor() {
		super();
		this.registerAsType(RouteAnalysisServiceFactory.MemoryPersistenceDescriptor, RouteAnalysisMemoryPersistence);
		this.registerAsType(RouteAnalysisServiceFactory.FilePersistenceDescriptor, RouteAnalysisFilePersistence);
		this.registerAsType(RouteAnalysisServiceFactory.MongoDbPersistenceDescriptor, RouteAnalysisMongoDbPersistence);
		this.registerAsType(RouteAnalysisServiceFactory.ControllerDescriptor, RouteAnalysisController);
		this.registerAsType(RouteAnalysisServiceFactory.HttpServiceDescriptor, RouteAnalysisHttpServiceV1);
	}
	
}
