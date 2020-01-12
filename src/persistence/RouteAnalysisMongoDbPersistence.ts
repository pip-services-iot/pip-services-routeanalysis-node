let _ = require('lodash');

import { FilterParams } from 'pip-services3-commons-node';
import { PagingParams } from 'pip-services3-commons-node';
import { DataPage } from 'pip-services3-commons-node';
import { IdGenerator } from 'pip-services3-commons-node';
import { IdentifiableMongoDbPersistence } from 'pip-services3-mongodb-node';

import { CurrentObjectRouteV1 } from '../data/version1/CurrentObjectRouteV1';
import { IRouteAnalysisPersistence } from './IRouteAnalysisPersistence';

export class RouteAnalysisMongoDbPersistence
    extends IdentifiableMongoDbPersistence<CurrentObjectRouteV1, string>
    implements IRouteAnalysisPersistence {

    constructor() {
        super('current_routes');
        super.ensureIndex({ org_id: 1, object_id: 1, start_time: -1, end_time: -1 });
    }

    private composeFilter(filter: any) {
        filter = filter || new FilterParams();

        let criteria = [];

        criteria.push({ type: { $exists: true } });

        let orgId = filter.getAsNullableString('org_id');
        if (orgId != null)
            criteria.push({ org_id: orgId });

        let id = filter.getAsNullableString('id');
        if (id != null)
            criteria.push({ _id: id });

        let objectId = filter.getAsNullableString('object_id');
        if (objectId != null)
            criteria.push({ object_id: objectId });

        let type = filter.getAsNullableString('type');
        if (type != null)
            criteria.push({ type: type });
                
        // Filter ids
        let objectIds = filter.getAsObject('object_ids');
        if (_.isString(objectIds))
            objectIds = objectIds.split(',');
        if (_.isArray(objectIds))
            criteria.push({ object_id: { $in: objectIds } });

        let ids = filter.getAsObject('ids');
        if (_.isString(ids))
            ids = ids.split(',');
        if (_.isArray(ids))
            criteria.push({ _id: { $in: ids } });
                
        let fromTime = filter.getAsNullableDateTime('from_time');
        if (fromTime != null)
            criteria.push({ end_time: { $gte: fromTime } });

        let toTime = filter.getAsNullableDateTime('to_time');
        if (toTime != null)
            criteria.push({ start_time: { $lt: toTime } });

        let untilTime = filter.getAsNullableDateTime('until_time');
        if (untilTime != null)
            criteria.push({ end_time: { $gte: untilTime } });
                
        return criteria.length > 0 ? { $and: criteria } : null;
    }

    public getPageByFilter(correlationId: string, filter: FilterParams, paging: PagingParams,
        callback: (err: any, page: DataPage<CurrentObjectRouteV1>) => void): void {
        super.getPageByFilter(correlationId, this.composeFilter(filter),
            paging, "id", null, callback);
    }
    
}
