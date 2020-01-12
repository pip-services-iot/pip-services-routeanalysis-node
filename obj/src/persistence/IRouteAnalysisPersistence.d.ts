import { FilterParams } from 'pip-services3-commons-node';
import { PagingParams } from 'pip-services3-commons-node';
import { DataPage } from 'pip-services3-commons-node';
import { IGetter } from 'pip-services3-data-node';
import { ISetter } from 'pip-services3-data-node';
import { CurrentObjectRouteV1 } from '../data/version1/CurrentObjectRouteV1';
export interface IRouteAnalysisPersistence extends IGetter<CurrentObjectRouteV1, string>, ISetter<CurrentObjectRouteV1> {
    getPageByFilter(correlationId: string, filter: FilterParams, paging: PagingParams, callback: (err: any, page: DataPage<CurrentObjectRouteV1>) => void): void;
    getOneById(correlationId: string, id: string, callback: (err: any, item: CurrentObjectRouteV1) => void): void;
    set(correlationId: string, item: CurrentObjectRouteV1, callback: (err: any, item: CurrentObjectRouteV1) => void): void;
}
