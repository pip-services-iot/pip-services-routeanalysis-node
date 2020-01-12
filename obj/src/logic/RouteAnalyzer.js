"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
let _ = require('lodash');
let geojson = require('geojson-utils');
const pip_clients_routes_node_1 = require("pip-clients-routes-node");
const GeoJsonUtilities_1 = require("./GeoJsonUtilities");
const RouteConstants_1 = require("./RouteConstants");
const RouteCalculator_1 = require("./RouteCalculator");
class RouteAnalyzer {
    static checkEmptyRoute(route) {
        return route == null || route.start_time == null || route.end_time == null || route.type == null || route.object_id == null;
    }
    static checkObsoleteRoute(route, position) {
        let duration = (position.time.getTime() - route.end_time.getTime()) / 1000;
        return duration > RouteConstants_1.RouteConstants.CUTOFF_TIMEOUT;
    }
    static checkLongRoute(route) {
        if (route.type == pip_clients_routes_node_1.RouteTypeV1.Travel)
            return route.duration > RouteConstants_1.RouteConstants.TRAVEL_MAX_DURATION;
        else
            return route.duration > RouteConstants_1.RouteConstants.STAY_MAX_DURATION;
    }
    static checkMovedAfterStop(route, pos) {
        if (route.type != pip_clients_routes_node_1.RouteTypeV1.Stop && route.type != pip_clients_routes_node_1.RouteTypeV1.Stay)
            return false;
        if (route.positions == null || route.positions.length == 0)
            return false;
        let distance = GeoJsonUtilities_1.GeoJsonUtilities.calculateDistance(route.positions[0], { lat: pos.lat, lng: pos.lng });
        return distance > RouteConstants_1.RouteConstants.STOP_DISTANCE;
    }
    static checkStoppedAfterMove(route, pos) {
        if (route.type != pip_clients_routes_node_1.RouteTypeV1.Travel)
            return false;
        if (route.positions == null || route.positions.length == 0)
            return true;
        // Find cut off time
        let cutOffTime = new Date(pos.time.getTime() - RouteConstants_1.RouteConstants.STOP_TIMEOUT * 1000);
        let start = RouteCalculator_1.RouteCalculator.findTimeCutOff(route, cutOffTime);
        if (start < 0)
            return false;
        // Check the last point
        let startPos = route.positions[start];
        // Check the last point
        let duration = (pos.time.getTime() - startPos.time.getTime()) / 1000;
        if (duration < RouteConstants_1.RouteConstants.STOP_TIMEOUT)
            return false;
        let distance = GeoJsonUtilities_1.GeoJsonUtilities.calculateDistance(startPos, { lat: pos.lat, lng: pos.lng });
        if (distance > RouteConstants_1.RouteConstants.STOP_DISTANCE)
            return false;
        // Check all points are within the same range
        for (let index = start + 1; index < route.positions.length; index++) {
            let pos = route.positions[index];
            let distance = GeoJsonUtilities_1.GeoJsonUtilities.calculateDistance(startPos, pos);
            // Exit if movement was detected
            if (distance > RouteConstants_1.RouteConstants.STOP_DISTANCE)
                return false;
        }
        // Otherwise
        return true;
    }
    static checkStartedStaying(route, pos) {
        if (route.type != pip_clients_routes_node_1.RouteTypeV1.Stop)
            return false;
        if (route.positions == null || route.positions.length == 0)
            return true;
        let startPos = route.positions[0];
        let duration = (pos.time.getTime() - startPos.time.getTime()) / 1000;
        if (duration < RouteConstants_1.RouteConstants.STAY_TIMEOUT)
            return false;
        let distance = GeoJsonUtilities_1.GeoJsonUtilities.calculateDistance(pos, startPos);
        return distance <= RouteConstants_1.RouteConstants.STOP_DISTANCE;
    }
}
exports.RouteAnalyzer = RouteAnalyzer;
//# sourceMappingURL=RouteAnalyzer.js.map