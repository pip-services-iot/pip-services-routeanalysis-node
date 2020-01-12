import { FilterParams } from 'pip-services3-commons-node';
import { PagingParams } from 'pip-services3-commons-node';
import { DataPage } from 'pip-services3-commons-node';
import { IdentifiableMemoryPersistence } from 'pip-services3-data-node';
import { CurrentObjectRouteV1 } from '../data/version1/CurrentObjectRouteV1';
import { IRouteAnalysisPersistence } from './IRouteAnalysisPersistence';
export declare class RouteAnalysisMemoryPersistence extends IdentifiableMemoryPersistence<CurrentObjectRouteV1, string> implements IRouteAnalysisPersistence {
    constructor();
    private contains;
    private composeFilter;
    getPageByFilter(correlationId: string, filter: FilterParams, paging: PagingParams, callback: (err: any, page: DataPage<CurrentObjectRouteV1>) => void): void;
}
