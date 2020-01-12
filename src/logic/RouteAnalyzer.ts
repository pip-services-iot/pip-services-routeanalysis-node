let _ = require('lodash');
let geojson = require('geojson-utils');

import { RouteTypeV1 } from 'pip-clients-routes-node';
import { PositionV1 } from 'pip-clients-routes-node';

import { CurrentObjectRouteV1 } from '../data/version1/CurrentObjectRouteV1';
import { ObjectPositionV1 } from '../data/version1/ObjectPositionV1';

import { GeoJsonUtilities } from './GeoJsonUtilities';
import { RouteConstants } from './RouteConstants';
import { RouteCalculator } from './RouteCalculator';

export class RouteAnalyzer {

    public static checkEmptyRoute(route: CurrentObjectRouteV1): boolean {
        return route == null || route.start_time == null || route.end_time == null || route.type == null || route.object_id == null;
    }

    public static checkObsoleteRoute(route: CurrentObjectRouteV1, position: ObjectPositionV1): boolean {
        let duration = (position.time.getTime() - route.end_time.getTime()) / 1000;
        return duration > RouteConstants.CUTOFF_TIMEOUT;
    }

    public static checkLongRoute(route: CurrentObjectRouteV1): boolean {
        if (route.type == RouteTypeV1.Travel)
            return route.duration > RouteConstants.TRAVEL_MAX_DURATION;
        else
            return route.duration > RouteConstants.STAY_MAX_DURATION;
    }
    
    public static checkMovedAfterStop(route: CurrentObjectRouteV1, pos: ObjectPositionV1): boolean {
        if (route.type != RouteTypeV1.Stop && route.type != RouteTypeV1.Stay)
            return false;
        if (route.positions == null || route.positions.length == 0)
            return false;
        
        let distance = GeoJsonUtilities.calculateDistance(route.positions[0], { lat: pos.lat, lng: pos.lng });
        return distance > RouteConstants.STOP_DISTANCE;
    }

    public static checkStoppedAfterMove(route: CurrentObjectRouteV1, pos: ObjectPositionV1): boolean {
        if (route.type != RouteTypeV1.Travel)
            return false;
        if (route.positions == null || route.positions.length == 0)
            return true;

        // Find cut off time
        let cutOffTime = new Date(pos.time.getTime() - RouteConstants.STOP_TIMEOUT * 1000);
        let start = RouteCalculator.findTimeCutOff(route, cutOffTime);
        if (start < 0) return false;

        // Check the last point
        let startPos = route.positions[start];

        // Check the last point
        let duration = (pos.time.getTime() - startPos.time.getTime()) / 1000;
        if (duration < RouteConstants.STOP_TIMEOUT) return false;

        let distance = GeoJsonUtilities.calculateDistance(startPos, { lat: pos.lat, lng: pos.lng });
        if (distance > RouteConstants.STOP_DISTANCE)
            return false;

        // Check all points are within the same range
        for (let index = start + 1; index < route.positions.length; index++) {
            let pos = route.positions[index];
            let distance = GeoJsonUtilities.calculateDistance(startPos, pos);

            // Exit if movement was detected
            if (distance > RouteConstants.STOP_DISTANCE)
                return false;
        }

        // Otherwise
        return true;
    }

    public static checkStartedStaying(route: CurrentObjectRouteV1, pos: ObjectPositionV1): boolean {
        if (route.type != RouteTypeV1.Stop)
            return false;
        if (route.positions == null || route.positions.length == 0)
            return true;

        let startPos = route.positions[0];
        let duration = (pos.time.getTime() - startPos.time.getTime()) / 1000;
        if (duration < RouteConstants.STAY_TIMEOUT)
            return false;
        
        let distance = GeoJsonUtilities.calculateDistance(pos, startPos);
        return distance <= RouteConstants.STOP_DISTANCE;
    }
}