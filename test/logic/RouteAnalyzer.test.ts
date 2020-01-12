let _ = require('lodash');
let async = require('async');
let assert = require('chai').assert;

import { RouteTypeV1 } from 'pip-clients-routes-node';

import { CurrentObjectRouteV1 } from '../../src/data/version1/CurrentObjectRouteV1';
import { ObjectPositionV1 } from '../../src/data/version1/ObjectPositionV1';
import { RouteCalculator } from '../../src/logic/RouteCalculator';
import { RouteAnalyzer } from '../../src/logic/RouteAnalyzer';
import { RouteConstants } from '../../src/logic/RouteConstants';

suite('RouteAnalyzer', ()=> {    
    
    test('Check Empty Route', () => {
        let route: CurrentObjectRouteV1 = {
            id: '2',
            org_id: '1',
            object_id: '2',
            type: RouteTypeV1.Stay,
            start_time: new Date(2018, 0, 0, 0, 0, 0),
            end_time: new Date(2018, 0, 0, 0, 0, 0),
            positions: []
        };
        let result = RouteAnalyzer.checkEmptyRoute(route);
        assert.isFalse(result);

        route = { id: '2', org_id: '1', object_id: '2', type: null, start_time: null, positions: null };
        result = RouteAnalyzer.checkEmptyRoute(route);
        assert.isTrue(result);

        result = RouteAnalyzer.checkEmptyRoute(null);
        assert.isTrue(result);
    });

    test('Check Obsolete Route', () => {
        let time = new Date(2018, 0, 0, 0, 0, 0).getTime();
        let route: CurrentObjectRouteV1 = {
            id: '2',
            org_id: '1',
            object_id: '2',
            type: RouteTypeV1.Stay,
            start_time: new Date(time),
            end_time: new Date(time),
            positions: []
        };
        let pos: ObjectPositionV1 = {
            org_id: '1',
            object_id: '2',
            time: new Date(time + RouteConstants.CUTOFF_TIMEOUT * 1000 / 2),
            lat: 0, 
            lng: 0
        };
        let result = RouteAnalyzer.checkObsoleteRoute(route, pos);
        assert.isFalse(result);

        pos.time = new Date(time + RouteConstants.CUTOFF_TIMEOUT * 1000 * 2);
        result = RouteAnalyzer.checkObsoleteRoute(route, pos);
        assert.isTrue(result);
    });
    
    test('Check Moved After Stop', () => {
        let time = new Date(2018, 0, 0, 0, 0, 0).getTime();

        // Check moved
        let route: CurrentObjectRouteV1 = {
            id: '2',
            org_id: '1',
            object_id: '2',
            type: RouteTypeV1.Stay,
            start_time: new Date(time),
            end_time: new Date(time),
            positions: [ {  org_id: '1', object_id: '2', lat: 0, lng: 0, time: new Date(time) } ]
        };
        let pos: ObjectPositionV1 = {
            org_id: '1',
            object_id: '2',
            time: new Date(time + 5000),
            lat: 0.1, 
            lng: 0.1
        };
        let result = RouteAnalyzer.checkMovedAfterStop(route, pos);
        assert.isTrue(result);

        // Check keep moving
        route.type = RouteTypeV1.Travel;
        result = RouteAnalyzer.checkMovedAfterStop(route, pos);
        assert.isFalse(result);

        // Check stay
        route.type = RouteTypeV1.Stop;
        pos = {
            org_id: '1',
            object_id: '2',
            time: new Date(time + 5000),
            lat: 0, 
            lng: 0
        };
        result = RouteAnalyzer.checkMovedAfterStop(route, pos);
        assert.isFalse(result);
    });

    test('Check Stopped After Move', () => {
        let time = new Date(2018, 0, 0, 0, 0, 0).getTime();

        // Check stopped
        let route: CurrentObjectRouteV1 = {
            id: '2',
            org_id: '1',
            object_id: '2',
            type: RouteTypeV1.Travel,
            start_time: new Date(time),
            end_time: new Date(time),
            positions: [ 
                { org_id: '1', object_id: '2', lat: 0, lng: 0, time: new Date(time) },
                { org_id: '1', object_id: '2', lat: 0, lng: 0, time: new Date(time + RouteConstants.STOP_TIMEOUT * 1000 / 2) },
            ]
        };
        let pos: ObjectPositionV1 = {
            org_id: '1',
            object_id: '2',
            time: new Date(time + RouteConstants.STOP_TIMEOUT * 1000),
            lat: 0, 
            lng: 0
        };
        let result = RouteAnalyzer.checkStoppedAfterMove(route, pos);
        assert.isTrue(result);

        // Check keep stop
        route.type = RouteTypeV1.Stop;
        result = RouteAnalyzer.checkMovedAfterStop(route, pos);
        assert.isFalse(result);

        // Check stop for a short time
        route.type = RouteTypeV1.Travel;
        pos = {
            org_id: '1',
            object_id: '2',
            time: new Date(time + RouteConstants.STOP_TIMEOUT * 1000 / 2 + 1000),
            lat: 0, 
            lng: 0
        };
        result = RouteAnalyzer.checkMovedAfterStop(route, pos);
        assert.isFalse(result);

        // Check start moving
        pos = {
            org_id: '1',
            object_id: '2',
            time: new Date(time + RouteConstants.STOP_TIMEOUT * 1000),
            lat: 1, 
            lng: 1
        };
        result = RouteAnalyzer.checkMovedAfterStop(route, pos);
        assert.isFalse(result);
    });    

    test('Check Started Staying', () => {
        let time = new Date(2018, 0, 0, 0, 0, 0).getTime();

        // Check moved
        let route: CurrentObjectRouteV1 = {
            id: '2',
            org_id: '1',
            object_id: '2',
            type: RouteTypeV1.Stop,
            start_time: new Date(time),
            end_time: new Date(time),
            positions: [ { org_id: '1', object_id: '2', lat: 0, lng: 0, time: new Date(time) } ]
        };
        let pos: ObjectPositionV1 = {
            org_id: '1',
            object_id: '2',
            time: new Date(time + RouteConstants.STAY_TIMEOUT * 1000),
            lat: 0, 
            lng: 0
        };
        let result = RouteAnalyzer.checkStartedStaying(route, pos);
        assert.isTrue(result);

        // Check keep moving
        route.type = RouteTypeV1.Travel;
        result = RouteAnalyzer.checkStartedStaying(route, pos);
        assert.isFalse(result);

        // Check stay
        route.type = RouteTypeV1.Stop;
        pos = {
            org_id: '1',
            object_id: '2',
            time: new Date(time + 5000),
            lat: 0, 
            lng: 0
        };
        result = RouteAnalyzer.checkStartedStaying(route, pos);
        assert.isFalse(result);
    });

});