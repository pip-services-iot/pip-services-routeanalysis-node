"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
let _ = require('lodash');
let async = require('async');
let geojson = require('geojson-utils');
const pip_services3_commons_node_1 = require("pip-services3-commons-node");
const pip_services3_commons_node_2 = require("pip-services3-commons-node");
const pip_services3_commons_node_3 = require("pip-services3-commons-node");
const pip_services3_commons_node_4 = require("pip-services3-commons-node");
const pip_services3_components_node_1 = require("pip-services3-components-node");
const pip_clients_routes_node_1 = require("pip-clients-routes-node");
const RouteAnalysisCommandSet_1 = require("./RouteAnalysisCommandSet");
const RouteAnalyzer_1 = require("./RouteAnalyzer");
const RouteCalculator_1 = require("./RouteCalculator");
const RouteConstants_1 = require("./RouteConstants");
class RouteAnalysisController {
    constructor() {
        this._cache = null;
        this._lock = null;
        this._logger = new pip_services3_components_node_1.CompositeLogger();
        this._dependencyResolver = new pip_services3_commons_node_2.DependencyResolver(RouteAnalysisController._defaultConfig);
        this._lockTimeout = 5000;
        this._cacheTimeout = 5 * 60000;
        this._offlineCheckInterval = RouteConstants_1.RouteConstants.CUTOFF_TIMEOUT;
    }
    configure(config) {
        this._logger.configure(config);
        this._dependencyResolver.configure(config);
        this._offlineCheckInterval = config.getAsIntegerWithDefault('options.offline_check_interval', this._offlineCheckInterval);
        this._lockTimeout = config.getAsIntegerWithDefault('options.lock_timeout', this._lockTimeout);
        this._cacheTimeout = config.getAsIntegerWithDefault('options.cache_timeout', this._cacheTimeout);
    }
    setReferences(references) {
        this._logger.setReferences(references);
        this._dependencyResolver.setReferences(references);
        this._cache = this._dependencyResolver.getOneOptional('cache');
        this._lock = this._dependencyResolver.getOneOptional('lock');
        this._persistence = this._dependencyResolver.getOneRequired('persistence');
        this._routesClient = this._dependencyResolver.getOneRequired('routes');
    }
    getCommandSet() {
        if (this._commandSet == null)
            this._commandSet = new RouteAnalysisCommandSet_1.RouteAnalysisCommandSet(this);
        return this._commandSet;
    }
    isOpen() {
        return this._offlineCheckTimer != null;
    }
    open(correlationId, callback) {
        if (this._offlineCheckTimer == null) {
            this._offlineCheckTimer = setInterval(() => {
                this.processObsoleteRoutes();
            }, this._offlineCheckInterval * 1000);
        }
        if (callback)
            callback(null);
    }
    close(correlationId, callback) {
        if (this._offlineCheckTimer) {
            clearInterval(this._offlineCheckTimer);
            this._offlineCheckTimer = null;
        }
        if (callback)
            callback(null);
    }
    toRoute(route) {
        return {
            id: route.id,
            org_id: route.org_id,
            object_id: route.object_id,
            type: route.type,
            start_time: route.start_time,
            start_addr: route.start_addr,
            end_time: route.end_time,
            end_addr: route.end_addr,
            duration: route.duration,
            positions: route.positions
        };
    }
    toHistoricalRoute(route) {
        return {
            id: null,
            org_id: route.org_id,
            object_id: route.object_id,
            type: route.type || pip_clients_routes_node_1.RouteTypeV1.Travel,
            start_time: route.start_time,
            start_addr: route.start_addr,
            end_time: route.end_time,
            end_addr: route.end_addr,
            duration: route.duration,
            positions: route.positions
        };
    }
    filterPositions(route, fromTime, toTime) {
        if (route == null || route.positions == null)
            return route;
        if (fromTime != null) {
            route.positions = _.filter(route.positions, p => p.time >= fromTime);
        }
        if (toTime != null) {
            route.positions = _.filter(route.positions, p => p.time < toTime);
        }
        return route;
    }
    compressPositions(route, compressVal) {
        let newPositions = [];
        let i;
        for (i = 0; i < route.positions.length; i = i + compressVal) {
            newPositions.push(route.positions[i]);
        }
        // add last position
        if (i - compressVal != route.positions.length - 1) {
            newPositions.push(route.positions[route.positions.length - 1]);
        }
        route.positions = newPositions;
        return route;
    }
    getLastPosition(route) {
        if (!route)
            return null;
        if (!route.positions || route.positions.length == 0)
            return null;
        if (route.type == pip_clients_routes_node_1.RouteTypeV1.Travel) {
            return route.positions[route.positions.length - 1];
        }
        else {
            //  parametrs from last   stop route position
            let pos = route.positions[route.positions.length - 1];
            // take position from stop route, other positions delete when route simplify
            pos.lat = route.positions[0].lat;
            pos.lng = route.positions[0].lng;
            return pos;
        }
    }
    getCurrentRoutes(correlationId, filter, paging, callback) {
        this._persistence.getPageByFilter(correlationId, filter, paging, (err, page) => {
            if (page != null) {
                page.data = _.map(page.data, d => this.toRoute(d));
                // Perform point filtering by time
                if (filter != null) {
                    let fromTime = filter.getAsNullableDateTime('from_time');
                    let toTime = filter.getAsNullableDateTime('to_time');
                    let compress = filter.getAsNullableLong('compress');
                    if (fromTime != null || toTime != null)
                        page.data = _.map(page.data, d => this.filterPositions(d, fromTime, toTime));
                    // make compression
                    if (compress)
                        _.each(page.data, (route) => {
                            if (route.type == pip_clients_routes_node_1.RouteTypeV1.Travel && route.positions && route.positions.length > 2) {
                                route = this.compressPositions(route, compress);
                            }
                        });
                }
            }
            callback(err, page);
        });
    }
    getCurrentRoute(correlationId, objectId, fromTime, toTime, callback) {
        this._persistence.getOneById(correlationId, objectId, (err, data) => {
            let route = data != null ? this.toRoute(data) : null;
            // Perform point filtering by time
            if (route != null)
                route = this.filterPositions(route, fromTime, toTime);
            callback(err, route);
        });
    }
    getNextRoute(route, pos) {
        // For empty route there is no cutoff
        if (RouteAnalyzer_1.RouteAnalyzer.checkEmptyRoute(route))
            return null;
        // For obsolete route cut the entire route
        if (RouteAnalyzer_1.RouteAnalyzer.checkObsoleteRoute(route, pos)) {
            return RouteCalculator_1.RouteCalculator.makeEmptyRoute(pos);
        }
        // For too long routes
        if (RouteAnalyzer_1.RouteAnalyzer.checkLongRoute(route)) {
            let lastPos = this.getLastPosition(route);
            lastPos.object_id = lastPos.object_id ? lastPos.object_id : route.object_id;
            lastPos.org_id = lastPos.org_id ? lastPos.org_id : route.org_id;
            return RouteCalculator_1.RouteCalculator.makeNextRoute(lastPos);
        }
        // When object started to move after stop
        if (route.type == pip_clients_routes_node_1.RouteTypeV1.Stop || route.type == pip_clients_routes_node_1.RouteTypeV1.Stay) {
            if (RouteAnalyzer_1.RouteAnalyzer.checkMovedAfterStop(route, pos)) {
                // todo check DIFF_TIME between stop position and current position, now CUTOFF_TIMEOUT
                let lastPos = this.getLastPosition(route);
                lastPos.object_id = lastPos.object_id ? lastPos.object_id : route.object_id;
                lastPos.org_id = lastPos.org_id ? lastPos.org_id : route.org_id;
                return RouteCalculator_1.RouteCalculator.makeNextRoute(lastPos);
                // return RouteCalculator.makeEmptyRoute(pos);
            }
        }
        // When object stopped after moving
        if (route.type == pip_clients_routes_node_1.RouteTypeV1.Travel) {
            if (RouteAnalyzer_1.RouteAnalyzer.checkStoppedAfterMove(route, pos)) {
                // let stopTime = new Date(pos.time.getTime() - RouteConstants.STOP_TIMEOUT);
                // let nextRoute = RouteCalculator.timeCutOffRoute(route, stopTime);
                let distance = RouteConstants_1.RouteConstants.STOP_DISTANCE;
                let nextRoute = RouteCalculator_1.RouteCalculator.distanceCutOffRoute(route, pos, distance);
                if (nextRoute != null)
                    nextRoute.type = pip_clients_routes_node_1.RouteTypeV1.Stop;
                else
                    route.type = pip_clients_routes_node_1.RouteTypeV1.Stop;
                return nextRoute;
            }
        }
        // Switch to stay
        if (route.type == pip_clients_routes_node_1.RouteTypeV1.Stop) {
            if (RouteAnalyzer_1.RouteAnalyzer.checkStartedStaying(route, pos))
                route.type = pip_clients_routes_node_1.RouteTypeV1.Stay;
        }
        return null;
    }
    acquireRouteLock(correlationId, objectId, callback) {
        if (this._lock == null) {
            callback(null, true);
            return;
        }
        let key = "pip-services-routeanalysis:" + objectId;
        this._lock.tryAcquireLock(correlationId, key, this._lockTimeout, callback);
    }
    releaseRouteLock(correlationId, objectId, callback) {
        if (this._lock == null) {
            callback(null);
            return;
        }
        let key = "pip-routeanalysis-lock:" + objectId;
        this._lock.releaseLock(correlationId, key, callback);
    }
    loadRouteFromCache(correlationId, objectId, callback) {
        if (this._cache == null) {
            callback(null, null);
            return;
        }
        let key = "pip-routeanalysis-value:" + objectId;
        this._cache.retrieve(correlationId, key, callback);
    }
    saveRouteToCache(correlationId, route, callback) {
        if (this._cache == null) {
            callback(null);
            return;
        }
        let key = "pip-routeanalysis-value:" + route.object_id;
        this._cache.store(correlationId, key, route, this._cacheTimeout, callback);
    }
    fixPosition(position) {
        position.time = pip_services3_commons_node_4.DateTimeConverter.toDateTime(position.time);
        return position;
    }
    addPosition(correlationId, position, callback) {
        let route;
        let locked = false;
        if (position == null || position.object_id == null || position.lat == null || position.lng == null
            || position.lat == NaN || position.lng == NaN) {
            if (callback)
                callback(null);
            return;
        }
        // Convert time just in case
        position = this.fixPosition(position);
        async.series([
            // Obtain lock
            (callback) => {
                this.acquireRouteLock(correlationId, position.object_id, (err, result) => {
                    locked = err == null && result;
                    callback(err);
                });
            },
            // Read route from cache
            (callback) => {
                this.loadRouteFromCache(correlationId, position.object_id, (err, data) => {
                    route = data;
                    callback(err);
                });
            },
            // Retrieve current route
            (callback) => {
                // If route was retrieved from cache then exit
                if (route != null) {
                    callback(null);
                    return;
                }
                this._persistence.getOneById(correlationId, position.object_id, (err, data) => {
                    route = data;
                    // Initialize route if it didn't exist
                    if (err == null && route == null) {
                        route = RouteCalculator_1.RouteCalculator.makeEmptyRoute(position);
                    }
                    callback(err);
                });
            },
            // check last position time
            (callback) => {
                // If route was retrieved from cache then exit
                if (route == null) {
                    callback(null);
                    return;
                }
                if (route.end_time < position.time) {
                    callback(null);
                    return;
                }
                // skip position
                callback('abort');
            },
            // Save old route if it has to split
            (callback) => {
                let nextRoute = this.getNextRoute(route, position);
                if (nextRoute == null) {
                    callback(null);
                    return;
                }
                // Save old route asynchronously
                let historicalRoute = this.toHistoricalRoute(route);
                historicalRoute = RouteCalculator_1.RouteCalculator.simplifyRoute(historicalRoute);
                this._routesClient.createRoute(correlationId, historicalRoute.org_id, historicalRoute, (err) => {
                    // Reset route after saving
                    // if (err == null) {
                    //     route = nextRoute;
                    // }
                    if (err) {
                        this._logger.error(correlationId, err, 'Error adding route for object: ' + historicalRoute.object_id + ' org_id: ' + historicalRoute.org_id
                            + ' type: ' + historicalRoute.type + ' pos: ' + historicalRoute.positions.length
                            + ' duration ' + historicalRoute.duration + ' new route positions :  ' + route.positions + ' err:  ' + err);
                    }
                    else {
                    }
                    // callback(err);
                });
                route = nextRoute;
                callback(null);
            },
            // Add point and save current route
            (callback) => {
                RouteCalculator_1.RouteCalculator.addPosition(route, position);
                this._persistence.set(correlationId, route, callback);
            },
            // Store route into cache
            (callback) => {
                this.saveRouteToCache(correlationId, route, callback);
            }
        ], (err) => {
            if (err == 'abort')
                err = null;
            if (locked) {
                this.releaseRouteLock(correlationId, position.object_id, (err2) => {
                    if (callback)
                        callback(err || err2);
                });
            }
            else if (callback)
                callback(err);
        });
    }
    addPositions(correlationId, positions, callback) {
        if (positions == null || positions.length == 0) {
            if (callback)
                callback(null);
            return;
        }
        positions = _.sortBy(positions, (p) => new Date(p.time).getTime());
        async.eachSeries(positions, (position, callback) => {
            if (position.object_id)
                this.addPosition(correlationId, position, callback);
            else
                callback();
        }, callback);
    }
    processObsoleteRoute(correlationId, route, callback) {
        // Protect against empty routes
        if (RouteAnalyzer_1.RouteAnalyzer.checkEmptyRoute(route)) {
            callback(null);
            return;
        }
        let locked = false;
        this._logger.debug(correlationId, 'processObsoleteRoute for object start: ' + route.object_id
            + ' type: ' + route.type + ' end_time: ' + route.end_time
            + ' now: ' + new Date());
        async.series([
            // Lock route
            (callback) => {
                this.acquireRouteLock(correlationId, route.object_id, (err, result) => {
                    locked = err == null && result;
                    callback(err);
                });
            },
            // Save obsolete route into history
            (callback) => {
                // Save old route asynchronously
                let historicalRoute = this.toHistoricalRoute(route);
                historicalRoute = RouteCalculator_1.RouteCalculator.simplifyRoute(historicalRoute);
                this._routesClient.createRoute("pip-services-routeanalysis", historicalRoute.org_id, historicalRoute, callback);
            },
            // Clear and save route into database
            (callback) => {
                route = RouteCalculator_1.RouteCalculator.clearRoute(route);
                this._persistence.set("pip-services-routeanalysis", route, callback);
            },
            // Store route into cache
            (callback) => {
                this.saveRouteToCache(correlationId, route, callback);
            }
        ], (err) => {
            if (locked) {
                this.releaseRouteLock(correlationId, route.object_id, (err2) => {
                    callback(err || err2);
                });
            }
            else
                callback(err);
        });
    }
    processObsoleteRoutes(callback) {
        let completed = false;
        let now = new Date().getTime();
        let cutOffTime = new Date(now - RouteConstants_1.RouteConstants.CUTOFF_TIMEOUT * 1000);
        let filter = pip_services3_commons_node_3.FilterParams.fromTuples('until_time', cutOffTime);
        async.whilst(() => { return !completed; }, (callback) => {
            this._persistence.getPageByFilter("pip-services-routeanalysis", filter, null, (err, page) => {
                if (err) {
                    callback(err);
                    return;
                }
                if (page.data == null || page.data.length == 0) {
                    completed = true;
                    callback();
                    return;
                }
                async.each(page.data, (route, callback) => {
                    this.processObsoleteRoute("pip-services-routeanalysis", route, callback);
                }, callback);
            });
        }, (err) => {
            if (err)
                this._logger.error("pip-services-routeanalysis", err, "Failed to process obsolete routes");
            if (callback)
                callback(err);
        });
    }
}
exports.RouteAnalysisController = RouteAnalysisController;
RouteAnalysisController._defaultConfig = pip_services3_commons_node_1.ConfigParams.fromTuples('dependencies.cache', '*:cache:*:*:1.0', 'dependencies.lock', '*:lock:*:*:1.0', 'dependencies.persistence', 'pip-services-routeanalysis:persistence:*:*:1.0', 'dependencies.routes', 'pip-services-routes:client:*:*:1.0');
//# sourceMappingURL=RouteAnalysisController.js.map