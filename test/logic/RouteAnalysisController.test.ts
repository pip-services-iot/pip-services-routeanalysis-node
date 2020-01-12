let _ = require('lodash');
let async = require('async');
let restify = require('restify');
let assert = require('chai').assert;

import { ConfigParams } from 'pip-services3-commons-node';
import { Descriptor } from 'pip-services3-commons-node';
import { References } from 'pip-services3-commons-node';
import { MemoryLock } from 'pip-services3-components-node';
import { MemoryCache } from 'pip-services3-components-node';

import { RouteTypeV1 } from 'pip-clients-routes-node';
import { RoutesNullClientV1 } from 'pip-clients-routes-node';

import { ObjectPositionV1 } from '../../src/data/version1/ObjectPositionV1';
import { RouteAnalysisController } from '../../src/logic/RouteAnalysisController';
import { RouteAnalysisMemoryPersistence } from '../../src/persistence/RouteAnalysisMemoryPersistence';
import { RouteConstants } from '../../src/logic/RouteConstants';

suite('RouteAnalysisController', ()=> {    
    let controller: RouteAnalysisController;

    setup(() => {
        controller = new RouteAnalysisController();
        controller.configure(new ConfigParams());

        let references: References = References.fromTuples(
            new Descriptor('pip-services', 'cache', 'memory', 'default', '1.0'), new MemoryCache(),
            new Descriptor('pip-services', 'lock', 'memory', 'default', '1.0'), new MemoryLock(),
            new Descriptor('pip-services-routes', 'client', 'null', 'default', '1.0'), new RoutesNullClientV1(),
            new Descriptor('pip-services-routeanalysis', 'persistence', 'memory', 'default', '1.0'), new RouteAnalysisMemoryPersistence(),
            new Descriptor('pip-services-routeanalysis', 'controller', 'default', 'default', '1.0'), controller
        );
        controller.setReferences(references);
    });
    
    test('CRUD Operations', (done) => {
        let time = new Date().getTime();

        async.series([
            // Add point
            (callback) => {
                controller.addPosition(
                    null,
                    { org_id: '1', object_id: '1', time: new Date(time), lat: 1, lng: 1 },
                    (err) => {
                        assert.isNull(err);
                        callback(err);
                    }
                );
            },
            // Add another point
            (callback) => {
                controller.addPositions(
                    null,
                    [ { org_id: '1', object_id: '2', time: new Date(time), lat: 2, lng: 2 } ],
                    (err) => {
                        assert.isNull(err);
                        callback(err);
                    }
                );
            },
            // Get all routes
            (callback) => {
                controller.getCurrentRoutes(
                    null, null, null,
                    (err, page) => {
                        assert.isNull(err);

                        assert.isObject(page);
                        assert.lengthOf(page.data, 2);

                        callback();
                    }
                )
            },
            // Get route for specific object
            (callback) => {
                controller.getCurrentRoute(
                    null, '1', null, null, 
                    (err, route) => {
                        assert.isNull(err);

                        assert.isObject(route);
                        assert.equal(RouteTypeV1.Travel, route.type);
                        assert.equal(time, route.start_time.getTime());
                        assert.equal(time, route.end_time.getTime());
                        assert.equal(0, route.duration);
                        assert.lengthOf(route.positions, 1);

                        callback();
                    }
                )
            },
        ], done);
    });

    test('Stop Route', (done) => {
        let time = new Date().getTime();

        controller.addPositions(
            null,
            [
                { org_id: '1', object_id: '1', time: new Date(time), lat: 1, lng: 1 },
                { org_id: '1', object_id: '1', time: new Date(time + RouteConstants.STOP_TIMEOUT * 1000 / 2), lat: 1, lng: 1 },
                { org_id: '1', object_id: '1', time: new Date(time + RouteConstants.STOP_TIMEOUT * 1000), lat: 1, lng: 1 }
            ],
            (err) => {
                assert.isNull(err);

                controller.getCurrentRoute(
                    null, '1', null, null, 
                    (err, route) => {
                        assert.isNull(err);

                        assert.isObject(route);
                        assert.equal(RouteTypeV1.Stop, route.type);
                        assert.equal(time, route.start_time.getTime());
                        assert.equal(time + RouteConstants.STOP_TIMEOUT * 1000, route.end_time.getTime());
                        assert.equal(RouteConstants.STOP_TIMEOUT, route.duration);
                        assert.lengthOf(route.positions, 3);

                        done();
                    }
                )
            }
        );
    });
    
    test('Stay Route', (done) => {
        let time = new Date().getTime();

        controller.addPositions(
            null,
            [
                { org_id: '1', object_id: '1', time: new Date(time), lat: 1, lng: 1 },
                { org_id: '1', object_id: '1', time: new Date(time + RouteConstants.STOP_TIMEOUT * 1000 / 2), lat: 1, lng: 1 },
                { org_id: '1', object_id: '1', time: new Date(time + RouteConstants.STOP_TIMEOUT * 1000), lat: 1, lng: 1 },
                { org_id: '1', object_id: '1', time: new Date(time + RouteConstants.STAY_TIMEOUT * 1000), lat: 1, lng: 1 },
            ],
            (err) => {
                assert.isNull(err);

                controller.getCurrentRoute(
                    null, '1', null, null, 
                    (err, route) => {
                        assert.isNull(err);

                        assert.isObject(route);
                        assert.equal(RouteTypeV1.Stay, route.type);
                        assert.equal(time, route.start_time.getTime());
                        assert.equal(time + RouteConstants.STAY_TIMEOUT * 1000, route.end_time.getTime());
                        assert.equal(RouteConstants.STAY_TIMEOUT, route.duration);
                        assert.lengthOf(route.positions, 4);

                        done();
                    }
                )
            }
        );
    });

    test('Move After Stay Route', (done) => {
        let time = new Date().getTime();

        controller.addPositions(
            null,
            [
                { org_id: '1', object_id: '1', time: new Date(time), lat: 1, lng: 1 },
                { org_id: '1', object_id: '1', time: new Date(time + RouteConstants.STOP_TIMEOUT * 1000 / 2), lat: 1, lng: 1 },
                { org_id: '1', object_id: '1', time: new Date(time + RouteConstants.STOP_TIMEOUT * 1000), lat: 1, lng: 1 },
                { org_id: '1', object_id: '1', time: new Date(time + RouteConstants.STAY_TIMEOUT * 1000), lat: 1, lng: 1 },
                { org_id: '1', object_id: '1', time: new Date(time + RouteConstants.STAY_TIMEOUT * 1000 + 1000), lat: 2, lng: 2 },
            ],
            (err) => {
                assert.isNull(err);

                controller.getCurrentRoute(
                    null, '1', null, null, 
                    (err, route) => {
                        assert.isNull(err);

                        assert.isObject(route);
                        assert.equal(RouteTypeV1.Travel, route.type);
                        assert.equal(time + RouteConstants.STAY_TIMEOUT * 1000, route.start_time.getTime());
                        assert.equal(time + RouteConstants.STAY_TIMEOUT * 1000 + 1000, route.end_time.getTime());
                        assert.equal(1, route.duration);
                        assert.lengthOf(route.positions, 2);

                        done();
                    }
                );
            }
        );
    });

    test('Process Obsolete', (done) => {
        let time = new Date().getTime();

        controller.addPositions(
            null,
            [
                { org_id: '1', object_id: '1', time: new Date(time - RouteConstants.CUTOFF_TIMEOUT * 1000 - 1000), lat: 1, lng: 1 }
            ],
            (err) => {
                assert.isNull(err);

                controller.processObsoleteRoutes(
                    (err) => {
                        assert.isNull(err);

                        controller.getCurrentRoute(
                            null, '1', null, null, 
                            (err, route) => {
                                assert.isNull(err);
                                assert.isObject(route);
                                assert.equal(RouteTypeV1.Travel, route.type);
                                assert.lengthOf(route.positions, 1);

                                done();
                            }
                        );
                    }
                )
            }
        );
    });

});