import { ConfigParams } from 'pip-services3-commons-node';
import { JsonFilePersister } from 'pip-services3-data-node';
import { RouteAnalysisMemoryPersistence } from './RouteAnalysisMemoryPersistence';
import { CurrentObjectRouteV1 } from '../data/version1/CurrentObjectRouteV1';
export declare class RouteAnalysisFilePersistence extends RouteAnalysisMemoryPersistence {
    protected _persister: JsonFilePersister<CurrentObjectRouteV1>;
    constructor(path?: string);
    configure(config: ConfigParams): void;
}
