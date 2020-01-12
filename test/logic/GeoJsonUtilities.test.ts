let _ = require('lodash');
let async = require('async');
let assert = require('chai').assert;

import { GeoJsonUtilities } from '../../src/logic/GeoJsonUtilities';

import { ObjectPositionV1 } from '../../src/data/version1/ObjectPositionV1';
import { RouteCalculator } from '../../src/logic/RouteCalculator';
import { CurrentObjectRouteV1 } from '../../src/data/version1/CurrentObjectRouteV1';
import { TimedPositionV1 } from '../../src/data/version1/TimedPositionV1';

import { RouteTypeV1 } from 'pip-clients-routes-node';
import { ObjectRouteV1 } from 'pip-clients-routes-node';
import { RandomFloat } from 'pip-services3-commons-node';

suite('GeoJsonUtilities', ()=> {    
    
    test('Calculate Distance', () => {
        let p1 = { lat: 0, lng: 0 };
        let p2 = { lat: 1, lng: 1 };
        let distance = GeoJsonUtilities.calculateDistance(p1, p2);
        assert.isTrue(distance > 0);
    });
    
    test('Simplify long route', () => {
        let lat = 32;
        let lng = -110;
        let positions = [];

        for (let index = 0; index < 100; index++) {
            let position = {
                index: index,
                lat: lat,
                lng: lng
            };
            lat += 0.0005;
            lng += 0.0005;
            positions.push(position);
        }

        let d = GeoJsonUtilities.calculateDistance(positions[0], positions[99]);
        let pos1 = GeoJsonUtilities.simplifyPath(positions, 200, 1000, 5);
        assert.isTrue(pos1.length < 100);

        let pos2 = GeoJsonUtilities.simplifyPath(positions, 1000, 5000, 5);
        assert.isTrue(pos2.length < 50);
    });
    
});