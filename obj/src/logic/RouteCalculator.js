"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
let _ = require('lodash');
const pip_clients_routes_node_1 = require("pip-clients-routes-node");
const RouteConstants_1 = require("./RouteConstants");
const GeoJsonUtilities_1 = require("./GeoJsonUtilities");
class RouteCalculator {
    static simplifyRoute(route) {
        if (route.type == pip_clients_routes_node_1.RouteTypeV1.Stay || route.type == pip_clients_routes_node_1.RouteTypeV1.Stop) {
            if (route.positions && route.positions.length > 0)
                route.positions = [route.positions[0]];
        }
        else {
            // There is a bug in geojson-utils when there are less then 3 points
            if (route.positions && route.positions.length > 3) {
                route.positions = GeoJsonUtilities_1.GeoJsonUtilities.simplifyPath(route.positions, RouteConstants_1.RouteConstants.OPTIMIZE_SHORT_DISTANCE, RouteConstants_1.RouteConstants.OPTIMIZE_LONG_DISTANCE, RouteConstants_1.RouteConstants.OPTIMIZE_LONG_ANGLE);
            }
        }
        return route;
    }
    static makeEmptyRoute(position) {
        return {
            id: position.object_id,
            org_id: position.org_id,
            object_id: position.object_id,
            type: null,
            start_time: null,
            start_addr: null,
            end_time: null,
            end_addr: null,
            duration: null,
            compressed: 0,
            positions: null
        };
    }
    static makeNextRoute(position) {
        let route = RouteCalculator.makeEmptyRoute(position);
        if (position) {
            route = this.addPosition(route, position);
        }
        return route;
    }
    static clearRoute(route) {
        if (route == null)
            return route;
        route.type = null;
        route.start_time = null;
        route.start_addr = null;
        route.end_time = null;
        route.end_addr = null;
        route.duration = null;
        route.compressed = 0;
        route.positions = null;
        return route;
    }
    static sortPositions(route) {
        if (route == null || route.positions == null || route.positions.length == 0)
            return route;
        route.positions = _.sortBy(route.positions, [(p) => p.time.getTime()]);
        return route;
    }
    static addPosition(route, pos) {
        if (route == null)
            route = RouteCalculator.makeEmptyRoute(pos);
        route.type = route.type || pip_clients_routes_node_1.RouteTypeV1.Travel;
        route.start_time = route.start_time || pos.time;
        route.end_time = pos.time;
        route.duration = (route.end_time.getTime() - route.start_time.getTime()) / 1000;
        route.positions = route.positions || [];
        route.compressed = route.compressed || 0;
        route.positions.push(pos);
        // Simplify route when it grow too much
        if (route.positions.length - route.compressed > RouteConstants_1.RouteConstants.COMPRESS_SIZE) {
            route = RouteCalculator.simplifyRoute(route);
            route.compressed = route.positions.length;
        }
        return route;
    }
    static findTimeCutOff(route, time) {
        if (route == null || route.positions == null || route.positions.length == 0)
            return -1;
        let ticks = time.getTime();
        for (let index = route.positions.length - 1; index >= 0; index--) {
            let pos = route.positions[index];
            if (ticks >= pos.time.getTime())
                return index;
            // return index + 1 < route.positions.length ? index + 1 : -1;
        }
        return -1;
    }
    // public static timeCutOffRoute(route: CurrentObjectRouteV1, time: Date): CurrentObjectRouteV1 {
    //     if (route == null || route.positions == null || route.positions.length ==0)
    //         return null;
    //     let start = RouteCalculator.findTimeCutOff(route, time);
    //     // Return null if there is not cutoff
    //     if (start < 0) return null;
    //     // Return null and change type if stop starts from the beginning
    //     if (start == 0) {
    //         if (route.type == RouteTypeV1.Travel)
    //             route.type = RouteTypeV1.Stop;
    //         return null;
    //     }
    //     let nextRoute: CurrentObjectRouteV1 = {
    //         id: route.id,
    //         org_id: route.org_id,
    //         object_id: route.object_id,
    //         type: RouteTypeV1.Travel,
    //         start_time: route.positions[start].time,
    //         end_time: route.end_time,
    //         positions: route.positions.slice(start)
    //     };
    //     nextRoute.duration = nextRoute.end_time.getTime() - nextRoute.start_time.getTime();
    //     route.end_time = route.positions[start].time;
    //     route.duration = (route.end_time.getTime() - route.start_time.getTime()) / 1000;
    //     route.positions = route.positions.slice(0, start + 1);
    //     return nextRoute;
    // }
    static findDistanceCutOff(route, pos, maxDistance) {
        if (route == null || route.positions == null)
            return -1;
        let startPos = pos;
        for (let index = route.positions.length - 1; index >= 0; index--) {
            let pos = route.positions[index];
            let distance = GeoJsonUtilities_1.GeoJsonUtilities.calculateDistance(startPos, pos);
            if (distance > maxDistance)
                return index;
        }
        return -2;
    }
    static distanceCutOffRoute(route, pos, maxDistance) {
        if (route == null || route.positions == null || route.positions.length == 0)
            return null;
        let start = RouteCalculator.findDistanceCutOff(route, pos, maxDistance);
        // Return null and change type if stop starts from the beginning
        if (start == -2) {
            if (route.type == pip_clients_routes_node_1.RouteTypeV1.Travel)
                route.type = pip_clients_routes_node_1.RouteTypeV1.Stop;
            return null;
        }
        // Return null if there is not cutoff
        if (start < 0)
            return null;
        if (start == 0 && route.positions.length == 1)
            return null;
        start = start < route.positions.length - 1 ? start + 1 : route.positions.length - 1;
        let nextRoute = {
            id: route.id,
            org_id: route.org_id,
            object_id: route.object_id,
            type: pip_clients_routes_node_1.RouteTypeV1.Travel,
            start_time: route.positions[start].time,
            end_time: route.end_time,
            positions: route.positions.slice(start)
        };
        nextRoute.duration = (nextRoute.end_time.getTime() - nextRoute.start_time.getTime()) / 1000;
        route.positions = route.positions.slice(0, start + 1);
        route.end_time = route.positions[route.positions.length - 1].time;
        route.duration = (route.end_time.getTime() - route.start_time.getTime()) / 1000;
        return nextRoute;
    }
}
exports.RouteCalculator = RouteCalculator;
//# sourceMappingURL=RouteCalculator.js.map