let _ = require('lodash');
let async = require('async');

import { FilterParams } from 'pip-services3-commons-node';
import { PagingParams } from 'pip-services3-commons-node';
import { DataPage } from 'pip-services3-commons-node';
import { IdentifiableMemoryPersistence } from 'pip-services3-data-node';

import { CurrentObjectRouteV1 } from '../data/version1/CurrentObjectRouteV1';
import { IRouteAnalysisPersistence } from './IRouteAnalysisPersistence';

export class RouteAnalysisMemoryPersistence 
    extends IdentifiableMemoryPersistence<CurrentObjectRouteV1, string> 
    implements IRouteAnalysisPersistence {

    constructor() {
        super();
    }

    private contains(array1, array2) {
        if (array1 == null || array2 == null) return false;
        
        for (let i1 = 0; i1 < array1.length; i1++) {
            for (let i2 = 0; i2 < array2.length; i2++)
                if (array1[i1] == array2[i1]) 
                    return true;
        }
        
        return false;
    }
    
    private composeFilter(filter: FilterParams): any {
        filter = filter || new FilterParams();
        
        let id = filter.getAsNullableString('id');
        let objectId = filter.getAsNullableString('object_id');
        let orgId = filter.getAsNullableString('org_id');
        let type = filter.getAsNullableString('type');
        let objectIds = filter.getAsObject('object_ids');
        let ids = filter.getAsObject('ids');
        let fromTime = filter.getAsNullableDateTime('from_time');
        let toTime = filter.getAsNullableDateTime('to_time');
        let untilTime = filter.getAsNullableDateTime('until_time');
        
        // Process ids filter
        if (_.isString(objectIds))
            objectIds = objectIds.split(',');
        if (!_.isArray(objectIds))
            objectIds = null;

        // Process ids filter
        if (_.isString(ids))
            ids = ids.split(',');
        if (!_.isArray(ids))
            ids = null;
            
        return (item) => {
            if (item.type == null)
                return false;
            if (id && item.id != id) 
                return false;
            if (ids && _.indexOf(ids, item.id) < 0)
                return false;
            if (objectId && item.object_id != objectId) 
                return false;
            if (objectIds && _.indexOf(objectIds, item.object_id) < 0)
                return false;
            if (orgId && item.org_id != orgId) 
                return false;
            if (type && item.type != type) 
                return false;
            if (fromTime && (item.end_time == null || item.end_time.getTime() < fromTime.getTime()))
                return false;
            if (toTime && (item.start_time == null || item.start_time.getTime() >= toTime.getTime())) 
                return false;
            if (untilTime && (item.end_time == null || item.end_time.getTime() < untilTime.getTime()))
                return false;
            return true;
        };
    }
    
    public getPageByFilter(correlationId: string, filter: FilterParams, paging: PagingParams,
        callback: (err: any, page: DataPage<CurrentObjectRouteV1>) => void): void {
        super.getPageByFilter(correlationId, this.composeFilter(filter),
            paging, null, null, callback);
    }

}
