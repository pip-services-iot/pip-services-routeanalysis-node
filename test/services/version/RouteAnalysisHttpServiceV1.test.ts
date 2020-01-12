let _ = require('lodash');
let async = require('async');
let restify = require('restify');
let assert = require('chai').assert;

import { ConfigParams } from 'pip-services3-commons-node';
import { Descriptor } from 'pip-services3-commons-node';
import { References } from 'pip-services3-commons-node';

import { RouteTypeV1 } from 'pip-clients-routes-node';
import { RoutesNullClientV1 } from 'pip-clients-routes-node';

import { RouteAnalysisController } from '../../../src/logic/RouteAnalysisController';
import { RouteAnalysisHttpServiceV1 } from '../../../src/services/version1/RouteAnalysisHttpServiceV1';
import { RouteAnalysisMemoryPersistence } from '../../../src';

let httpConfig = ConfigParams.fromTuples(
    "connection.protocol", "http",
    "connection.host", "localhost",
    "connection.port", 3000
);

suite('RouteAnalysisHttpServiceV1', ()=> {    
    let service: RouteAnalysisHttpServiceV1;
    let rest: any;

    suiteSetup((done) => {
        let controller = new RouteAnalysisController();

        service = new RouteAnalysisHttpServiceV1();
        service.configure(httpConfig);

        let references: References = References.fromTuples(
            new Descriptor('pip-services-routes', 'client', 'null', 'default', '1.0'), new RoutesNullClientV1(),
            new Descriptor('pip-services-routeanalysis', 'persistence', 'memory', 'default', '1.0'), new RouteAnalysisMemoryPersistence(),
            new Descriptor('pip-services-routeanalysis', 'controller', 'default', 'default', '1.0'), controller,
            new Descriptor('pip-services-routeanalysis', 'service', 'http', 'default', '1.0'), service
        );
        controller.setReferences(references);
        service.setReferences(references);

        service.open(null, done);
    });
    
    suiteTeardown((done) => {
        service.close(null, done);
    });

    setup((done) => {
        let url = 'http://localhost:3000';
        rest = restify.createJsonClient({ url: url, version: '*' });
        done();
    });
        
    test('CRUD operations', (done) => {
        let time = new Date().getTime();

        async.series([
            // Add point
            (callback) => {
                rest.post('/v1/route_analysis/add_position',
                    {
                        position: { org_id: '1', object_id: '1', time: new Date(time), lat: 1, lng: 1 }
                    },
                    (err, req, res) => {
                        assert.isNull(err);
                        callback(err);
                    }
                );
            },
            // Add another point
            (callback) => {
                rest.post('/v1/route_analysis/add_positions',
                    {
                        positions: [ { org_id: '1', object_id: '2', time: new Date(time), lat: 2, lng: 2 } ]
                    },
                    (err, req, res) => {
                        assert.isNull(err);
                        callback(err);
                    }
                );
            },
            // Get all routes
            (callback) => {
                rest.post('/v1/route_analysis/get_current_routes',
                    {},
                    (err, req, res, page) => {
                        assert.isNull(err);

                        assert.isObject(page);
                        assert.lengthOf(page.data, 2);

                        callback();
                    }
                )
            },
            // Get route for specific object
            (callback) => {
                rest.post('/v1/route_analysis/get_current_route',
                    {
                        object_id: '1'
                    },
                    (err, req, res, route) => {
                        assert.isNull(err);

                        assert.isObject(route);
                        assert.equal(RouteTypeV1.Travel, route.type);
                        // assert.equal(time, route.start_time.getTime());
                        // assert.equal(time, route.end_time.getTime());
                        assert.equal(0, route.duration);
                        assert.lengthOf(route.positions, 1);

                        callback();
                    }
                )
            },
        ], done);
    });

});