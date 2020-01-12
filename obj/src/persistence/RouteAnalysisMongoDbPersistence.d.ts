import { FilterParams } from 'pip-services3-commons-node';
import { PagingParams } from 'pip-services3-commons-node';
import { DataPage } from 'pip-services3-commons-node';
import { IdentifiableMongoDbPersistence } from 'pip-services3-mongodb-node';
import { CurrentObjectRouteV1 } from '../data/version1/CurrentObjectRouteV1';
import { IRouteAnalysisPersistence } from './IRouteAnalysisPersistence';
export declare class RouteAnalysisMongoDbPersistence extends IdentifiableMongoDbPersistence<CurrentObjectRouteV1, string> implements IRouteAnalysisPersistence {
    constructor();
    private composeFilter;
    getPageByFilter(correlationId: string, filter: FilterParams, paging: PagingParams, callback: (err: any, page: DataPage<CurrentObjectRouteV1>) => void): void;
}
