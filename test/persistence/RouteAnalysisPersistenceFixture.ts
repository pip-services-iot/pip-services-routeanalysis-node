let _ = require('lodash');
let async = require('async');
let assert = require('chai').assert;

import { FilterParams } from 'pip-services3-commons-node';
import { PagingParams } from 'pip-services3-commons-node';

import { CurrentObjectRouteV1 } from '../../src/data/version1/CurrentObjectRouteV1';

import { IRouteAnalysisPersistence } from '../../src/persistence/IRouteAnalysisPersistence';
import { RouteTypeV1 } from 'pip-clients-routes-node';

let now = new Date().getTime();
let interval = 300000;
let time1 = new Date(now);
let time2 = new Date(now + interval);
let time3 = new Date(now + 2 * interval);
let point1 = new Date(now);
let point2 = new Date(now + (interval / 2));
let point3 = new Date(now + interval);

let ROUTE1 = {
    id: '1',
    org_id: '1',
    object_id: '1',
    type: RouteTypeV1.Travel,
    start_time: time1,
    end_time: time2,
    duration: 1000,
    compressed: 0,
    positions: []
};
let ROUTE2 = {
    id: '2',
    org_id: '1',
    object_id: '2',
    type: RouteTypeV1.Stop,
    start_time: time1,
    end_time: time2,
    duration: 1000,
    compressed: 0,
    positions: []
};
let ROUTE3 = {
    id: '3',
    org_id: '2',
    object_id: '3',
    type: RouteTypeV1.Stay,
    start_time: time2,
    end_time: time3,
    duration: 1000,
    compressed: 0,
    positions: []
};

export class RouteAnalysisPersistenceFixture {
    private _persistence: IRouteAnalysisPersistence;
    
    constructor(persistence) {
        assert.isNotNull(persistence);
        this._persistence = persistence;
    }

    private testCreateRoutes(done) {
        async.series([
        // Create one route
            (callback) => {
                this._persistence.set(
                    null,
                    ROUTE1,
                    (err, route) => {
                        assert.isNull(err);

                        assert.equal(route.id, ROUTE1.id);
                        assert.equal(route.type, ROUTE1.type);

                        callback();
                    }
                );
            },
            // Create another route
            (callback) => {
                this._persistence.set(
                    null,
                    ROUTE2,
                    (err, route) => {
                        assert.isNull(err);

                        assert.equal(route.id, ROUTE2.id);
                        assert.equal(route.type, ROUTE2.type);

                        callback();
                    }
                );
            },
            // Set one more route
            (callback) => {
                this._persistence.set(
                    null,
                    ROUTE3,
                    (err, route) => {
                        assert.isNull(err);

                        assert.equal(route.id, ROUTE3.id);
                        assert.equal(route.type, ROUTE3.type);
                        
                        callback();
                    }
                );
            },
        ], done);
    }
                
    public testCrudOperations(done) {
        let route1: CurrentObjectRouteV1;

        async.series([
        // Create items
            (callback) => {
                this.testCreateRoutes(callback);
            },
        // Get all routes
            (callback) => {
                this._persistence.getPageByFilter(
                    null,
                    new FilterParams(),
                    new PagingParams(),
                    (err, page) => {
                        assert.isNull(err);

                        assert.isObject(page);
                        assert.lengthOf(page.data, 3);

                        route1 = page.data[0];

                        callback();
                    }
                );
            },
            // Update route
            (callback) => {
                route1 = _.clone(ROUTE1);
                route1.type = RouteTypeV1.Stop;
                route1.positions = [ { org_id: '1', object_id: '1', time: new Date(123), lat: 1, lng: 1 } ];

                this._persistence.set(
                    null,
                    route1,
                    (err, route) => {
                        assert.isNull(err);

                        assert.isNotNull(route);
                        assert.equal(RouteTypeV1.Stop, route.type);
                        assert.lengthOf(route.positions, 1);

                        callback();
                    }
                );
            },
            // Get route
            (callback) => {
                this._persistence.getOneById(
                    null,
                    '1',
                    (err, route) => {
                        assert.isNull(err);

                        assert.isNotNull(route);
                        assert.equal(RouteTypeV1.Stop, route.type);
                        assert.lengthOf(route.positions, 1);

                        callback();
                    }
                );
            },
        ], done);
    }

    public testGetWithFilter(done) {
        async.series([
        // Create routes
            (callback) => {
                this.testCreateRoutes(callback);
            },
        // Get routes filtered by organization
            (callback) => {
                this._persistence.getPageByFilter(
                    null,
                    FilterParams.fromValue({
                        org_id: '1'
                    }),
                    new PagingParams(),
                    (err, routes) => {
                        assert.isNull(err);

                        assert.isObject(routes);
                        assert.lengthOf(routes.data, 2);

                        callback();
                    }
                );
            },
        // Get routes by id
            (callback) => {
                this._persistence.getPageByFilter(
                    null,
                    FilterParams.fromValue({
                        id: '3'
                    }),
                    new PagingParams(),
                    (err, routes) => {
                        assert.isNull(err);
      
                        assert.isObject(routes);
                        assert.lengthOf(routes.data, 1);
         
                        callback();
                    }
                );
            },
        // Get routes by object_ids
            (callback) => {
                this._persistence.getPageByFilter(
                    null,
                    FilterParams.fromValue({
                        object_ids: '2'
                    }),
                    new PagingParams(),
                    (err, routes) => {
                        assert.isNull(err);

                        assert.isObject(routes);
                        assert.lengthOf(routes.data, 1);

                        callback();
                    }
                );
            },
        // Get routes filtered time
            (callback) => {
                this._persistence.getPageByFilter(
                    null,
                    FilterParams.fromValue({
                        from_time: time1,
                        to_time: time2
                    }),
                    new PagingParams(),
                    (err, routes) => {
                        assert.isNull(err);

                        assert.isObject(routes);
                        assert.lengthOf(routes.data, 2);

                        callback();
                    }
                );
            },
            // Get routes filtered by type
            (callback) => {
                this._persistence.getPageByFilter(
                    null,
                    FilterParams.fromValue({
                        type: RouteTypeV1.Travel
                    }),
                    new PagingParams(),
                    (err, routes) => {
                        assert.isNull(err);
                        assert.isObject(routes);
                        assert.lengthOf(routes.data, 1);

                        callback();
                    }
                );
            },
            // Get routes filtered by until_time
            (callback) => {
                this._persistence.getPageByFilter(
                    null,
                    FilterParams.fromValue({
                        until_time: time2
                    }),
                    new PagingParams(),
                    (err, routes) => {
                        assert.isNull(err);
                        assert.isObject(routes);
                        assert.lengthOf(routes.data, 3);
                        callback();
                    }
                );
            },
        ], done);
    }
    
}
