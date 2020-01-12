let _ = require('lodash');
let async = require('async');
let assert = require('chai').assert;

import { ObjectPositionV1 } from '../../src/data/version1/ObjectPositionV1';
import { RouteCalculator } from '../../src/logic/RouteCalculator';
import { CurrentObjectRouteV1 } from '../../src';
import { RouteTypeV1 } from 'pip-clients-routes-node';
import { ObjectRouteV1 } from 'pip-clients-routes-node';
import { RandomFloat } from 'pip-services3-commons-node';

suite('RouteCalculator', ()=> {    
    
    test('Simplify Route', () => {
        let route1: ObjectRouteV1 = {
            id: '1',
            org_id: '1',
            object_id: '1',
            type: RouteTypeV1.Stop,
            start_time: new Date(),
            end_time: new Date(),
            duration: 0,
            positions: [
                { lat: 0, lng: 0 },
                { lat: 0, lng: 0 }
            ]
        };
        let route = RouteCalculator.simplifyRoute(route1);
        assert.lengthOf(route.positions, 1);

        let route2: ObjectRouteV1 = {
            id: '2',
            org_id: '1',
            object_id: '1',
            type: RouteTypeV1.Travel,
            start_time: new Date(),
            end_time: new Date(),
            duration: 0,
            positions: []
        };

        let lat = 0;
        let lng = 0;
        for (let index = 0; index < 100; index++) {
            lat += RandomFloat.nextFloat(-0.0001, +0.001);
            lng += RandomFloat.nextFloat(-0.0001, +0.001);

            route2.positions.push({ lat: lat, lng: lng });
        }

        route = RouteCalculator.simplifyRoute(route1);
        assert.isArray(route.positions);
        assert.isTrue(route.positions.length > 0);
    });

    test('Make Empty Route', () => {
        let pos = {
            org_id: '1',
            object_id: '2',
            time: new Date(2018, 0, 0, 0, 0, 0),
            lat: 0,
            lng: 0
        };
        
        let route = RouteCalculator.makeEmptyRoute(pos);

        assert.isObject(route);
        assert.equal('1', route.org_id);
        assert.equal('2', route.object_id);
        assert.isNull(route.start_time || null);
    });

    test('Clear Route', () => {
        let route = {
            id: '2',
            org_id: '1',
            object_id: '2',
            start_time: new Date(2018, 0, 0, 0, 0, 0),
            positions: []
        };
        
        RouteCalculator.clearRoute(route);

        assert.isObject(route);
        assert.equal('2', route.id);
        assert.equal('1', route.org_id);
        assert.equal('2', route.object_id);
        assert.isNull(route.start_time || null);
        assert.isNull(route.positions || null);
    });

    test('Sort Positions', () => {
        let time = 12345;
        let route: CurrentObjectRouteV1 = {
            id: '2',
            org_id: '1',
            object_id: '2',
            start_time: new Date(2018, 0, 0, 0, 0, 0),
            positions: [
                { org_id: '1', object_id: '2', lat: 4, lng: 4, time: new Date(time + 50) },
                { org_id: '1', object_id: '2', lat: 3, lng: 3, time: new Date(time + 20) },
                { org_id: '1', object_id: '2', lat: 1, lng: 1, time: new Date(time) },
                { org_id: '1', object_id: '2', lat: 2, lng: 2, time: new Date(time + 10) },
            ]
        };
        
        route = RouteCalculator.sortPositions(route);

        assert.isObject(route);
        assert.lengthOf(route.positions, 4);
        assert.equal(1, route.positions[0].lat);
        assert.equal(2, route.positions[1].lat);
        assert.equal(3, route.positions[2].lat);
        assert.equal(4, route.positions[3].lat);
    });

    test('Add Position', () => {
        let time = 12345;
        let route: CurrentObjectRouteV1 = {
            id: '2',
            org_id: '1',
            object_id: '2',
            type: RouteTypeV1.Travel,
            start_time: new Date(time),
            positions: [
                { org_id: '1', object_id: '2', lat: 4, lng: 4, time: new Date(time + 50) },
                { org_id: '1', object_id: '2', lat: 3, lng: 3, time: new Date(time + 20) },
                { org_id: '1', object_id: '2', lat: 1, lng: 1, time: new Date(time) },
                { org_id: '1', object_id: '2', lat: 2, lng: 2, time: new Date(time + 10) },
            ]
        };
        let pos: ObjectPositionV1 = {
            org_id: '1',
            object_id: '2',
            time: new Date(time + 100),
            lat: 5, 
            lng: 5
        };

        // Add to existing route
        route = RouteCalculator.addPosition(route, pos);
        assert.isObject(route);
        assert.lengthOf(route.positions, 5);
        assert.equal(time, route.start_time.getTime());
        assert.equal(time + 100, route.end_time.getTime());
        assert.equal(0.1, route.duration);

        // Add to new route
        route = RouteCalculator.clearRoute(route);
        route = RouteCalculator.addPosition(route, pos);
        assert.isObject(route);
        assert.lengthOf(route.positions, 1);
        assert.equal(time + 100, route.start_time.getTime());
        assert.equal(time + 100, route.end_time.getTime());
        assert.equal(0, route.duration);

        // Add to null route
        route = RouteCalculator.addPosition(null, pos);
        assert.isObject(route);
        assert.lengthOf(route.positions, 1);
        assert.equal(time + 100, route.start_time.getTime());
        assert.equal(time + 100, route.end_time.getTime());
        assert.equal(0, route.duration);
    });

    test('Find Time Cutoff', () => {
        let time = 12345;
        let route: CurrentObjectRouteV1 = {
            id: '2',
            org_id: '1',
            object_id: '2',
            start_time: new Date(2018, 0, 0, 0, 0, 0),
            positions: [
                { org_id: '1', object_id: '2', lat: 1, lng: 1, time: new Date(time - 10) },
                { org_id: '1', object_id: '2', lat: 2, lng: 2, time: new Date(time) },
                { org_id: '1', object_id: '2', lat: 3, lng: 3, time: new Date(time + 20) },
                { org_id: '1', object_id: '2', lat: 4, lng: 4, time: new Date(time + 50) }
            ]
        };

        let index = RouteCalculator.findTimeCutOff(route, new Date(time));
        assert.equal(1, index);

        index = RouteCalculator.findTimeCutOff(route, new Date(time - 20));
        assert.equal(-1, index);

        index = RouteCalculator.findTimeCutOff(route, new Date(time + 100));
        assert.equal(3, index);
    });
    
    // test('Time Cutoff Route', () => {
    //     let time = 12345;
    //     let route: CurrentObjectRouteV1 = {
    //         id: '2',
    //         org_id: '1',
    //         object_id: '2',
    //         type: RouteTypeV1.Travel,
    //         start_time: new Date(time - 10),
    //         end_time: new Date(time + 50),
    //         positions: [
    //             { org_id: '1', object_id: '2', lat: 0, lng: 0, time: new Date(time - 10) },
    //             { org_id: '1', object_id: '2', lat: 0, lng: 0, time: new Date(time) },
    //             { org_id: '1', object_id: '2', lat: 0, lng: 0, time: new Date(time + 20) },
    //             { org_id: '1', object_id: '2', lat: 0, lng: 0, time: new Date(time + 50) }
    //         ]
    //     };
        
    //     let nextRoute = RouteCalculator.timeCutOffRoute(route, new Date(time + 20));
    //     assert.isObject(nextRoute);
    //     assert.equal(RouteTypeV1.Travel, nextRoute.type);
    //     assert.equal(time, nextRoute.start_time.getTime());
    //     assert.equal(time + 20, nextRoute.end_time.getTime());
    //     assert.lengthOf(route.positions, 1);
    //     assert.equal(RouteTypeV1.Travel, nextRoute.type);
    //     assert.equal(time - 10, route.start_time.getTime());
    //     assert.equal(time, route.end_time.getTime());
    //     assert.lengthOf(route.positions, 3);
    //     // Check too early
    //     nextRoute = RouteCalculator.timeCutOffRoute(route, new Date(time - 20));
    //     assert.isNull(nextRoute);

    //     // Check too late
    //     nextRoute = RouteCalculator.timeCutOffRoute(route, new Date(time + 100));
    //     assert.isNull(nextRoute);
    // });

    test('Find Distance Cutoff', () => {
        let time = 12345;
        let route: CurrentObjectRouteV1 = {
            id: '2',
            org_id: '1',
            object_id: '2',
            start_time: new Date(2018, 0, 0, 0, 0, 0),
            positions: [
                { org_id: '1', object_id: '2', lat: 1, lng: 1, time: new Date(time - 10) },
                { org_id: '1', object_id: '2', lat: 2, lng: 2, time: new Date(time) },
                { org_id: '1', object_id: '2', lat: 3, lng: 3, time: new Date(time + 20) },
                { org_id: '1', object_id: '2', lat: 4, lng: 4, time: new Date(time + 50) }
            ]
        };
        
        let index = RouteCalculator.findDistanceCutOff(route, { org_id: '1', object_id: '2', lat: 4, lng: 4, time: new Date(time + 60)}, 10);
        assert.equal(2, index);
    });    

    test('Distance Cutoff Route', () => {
        let time = 12345;
        let route: CurrentObjectRouteV1 = {
            id: '2',
            org_id: '1',
            object_id: '2',
            type: RouteTypeV1.Travel,
            start_time: new Date(time - 10),
            end_time: new Date(time + 50),
            positions: [
                { org_id: '1', object_id: '2', lat: 0, lng: 0, time: new Date(time - 10) },
                { org_id: '1', object_id: '2', lat: 1, lng: 1, time: new Date(time) },
                { org_id: '1', object_id: '2', lat: 2, lng: 2, time: new Date(time + 20) },
                { org_id: '1', object_id: '2', lat: 3, lng: 3, time: new Date(time + 50) }
            ]
        };
        
        let nextRoute = RouteCalculator.distanceCutOffRoute(route, { org_id: '1', object_id: '2', lat: 3, lng: 3, time: new Date(time + 60)}, 10);
        assert.isObject(nextRoute);

        assert.equal(RouteTypeV1.Travel, nextRoute.type);       
        assert.equal(time + 50, nextRoute.start_time.getTime());       
        assert.equal(time + 50, nextRoute.end_time.getTime());       
        assert.lengthOf(nextRoute.positions, 1);

        assert.equal(RouteTypeV1.Travel, nextRoute.type);
        assert.equal(time - 10, route.start_time.getTime());
        assert.equal(time + 50, route.end_time.getTime());
        assert.lengthOf(route.positions, 4);
    });
    
});