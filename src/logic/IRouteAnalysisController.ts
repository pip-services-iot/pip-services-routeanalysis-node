import { DataPage } from 'pip-services3-commons-node';
import { FilterParams } from 'pip-services3-commons-node';
import { PagingParams } from 'pip-services3-commons-node';

import { ObjectRouteV1 } from 'pip-clients-routes-node';
import { ObjectPositionV1 } from '../data/version1/ObjectPositionV1';
import { CurrentObjectRouteV1 } from '../data/version1/CurrentObjectRouteV1';

export interface IRouteAnalysisController {
    getCurrentRoutes(correlationId: string, filter: FilterParams, paging: PagingParams, 
        callback: (err: any, page: DataPage<ObjectRouteV1>) => void): void;

    getCurrentRoute(correlationId: string, objectId: string, fromTime: Date, toTime: Date, 
        callback: (err: any, route: ObjectRouteV1) => void): void;

    addPosition(correlationId: string, position: ObjectPositionV1,
        callback?: (err: any) => void): void;

    addPositions(correlationId: string, positions: ObjectPositionV1[],
        callback?: (err: any) => void): void;        
}
