let _ = require('lodash');
let async = require('async');
let assert = require('chai').assert;

import { Descriptor } from 'pip-services3-commons-node';
import { ConfigParams } from 'pip-services3-commons-node';
import { References } from 'pip-services3-commons-node';
import { ConsoleLogger } from 'pip-services3-components-node';

import { RouteTypeV1 } from 'pip-clients-routes-node';

import { RouteAnalysisController } from '../../src/logic/RouteAnalysisController';
import { RouteAnalysisLambdaFunction } from '../../src/container/RouteAnalysisLambdaFunction';

suite('RouteAnalysisLambdaFunction', ()=> {
    let lambda: RouteAnalysisLambdaFunction;

    suiteSetup((done) => {
        let config = ConfigParams.fromTuples(
            'logger.descriptor', 'pip-services:logger:console:default:1.0',
            'routes.descriptor', 'pip-services-routes:client:null:default:1.0',
            'persistence.descriptor', 'pip-services-routeanalysis:persistence:memory:default:1.0',
            'controller.descriptor', 'pip-services-routeanalysis:controller:default:default:1.0'
        );

        lambda = new RouteAnalysisLambdaFunction();
        lambda.configure(config);
        lambda.open(null, done);
    });
    
    suiteTeardown((done) => {
        lambda.close(null, done);
    });
    
    test('CRUD operations', (done) => {
        let time = new Date().getTime();

        async.series([
            // Add point
            (callback) => {
                lambda.act(
                    {
                        role: 'route_analysis',
                        cmd: 'add_position',
                        position: { org_id: '1', object_id: '1', time: new Date(time), lat: 1, lng: 1 }
                    },
                    (err) => {
                        assert.isNull(err);
                        callback(err);
                    }
                );
            },
            // Add another point
            (callback) => {
                lambda.act(
                    {
                        role: 'route_analysis',
                        cmd: 'add_positions',
                        positions: [ { org_id: '1', object_id: '2', time: new Date(time), lat: 2, lng: 2 } ]
                    },
                    (err) => {
                        assert.isNull(err);
                        callback(err);
                    }
                );
            },
            // Get all routes
            (callback) => {
                lambda.act(
                    {
                        role: 'route_analysis',
                        cmd: 'get_current_routes'
                    },
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
                lambda.act(
                    {
                        role: 'route_analysis',
                        cmd: 'get_current_route',
                        object_id: '1'
                    },
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
    
});