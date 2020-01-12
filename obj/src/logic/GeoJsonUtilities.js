"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
let geojson = require('geojson-utils');
class GeoJsonUtilities {
    static calculateDistance(pos1, pos2) {
        let p1 = { type: 'Point', coordinates: [pos1.lng, pos1.lat] };
        let p2 = { type: 'Point', coordinates: [pos2.lng, pos2.lat] };
        return geojson.pointDistance(p1, p2);
    }
    static calculateBearing(pos1, pos2) {
        let lat1 = geojson.numberToRadius(pos1.lat);
        let lng1 = geojson.numberToRadius(pos1.lng);
        let lat2 = geojson.numberToRadius(pos2.lat);
        let lng2 = geojson.numberToRadius(pos2.lng);
        let y = Math.sin(lng2 - lng1) * Math.cos(lat2);
        let x = Math.cos(lat1) * Math.sin(lat2)
            - Math.sin(lat1) * Math.cos(lat2) * Math.cos(lng2 - lng1);
        let b = Math.atan2(y, x);
        return b;
    }
    static simplify(source, kink) {
        /* kink	in metres, kinks above this depth kept  */
        /* kink depth is the height of the triangle abc where a-b and b-c are two consecutive line segments */
        kink = kink || 20;
        // source = source.map(function (o) {
        //   return {
        //     lng: o.lng,
        //     lat: o.lat
        //   }
        // });
        let n_source, n_stack, n_dest, start, end, i, sig;
        let dev_sqr, max_dev_sqr, band_sqr;
        let x12, y12, d12, x13, y13, d13, x23, y23, d23;
        let F = (Math.PI / 180.0) * 0.5;
        let index = new Array(); /* aray of indexes of source points to include in the reduced line */
        let sig_start = new Array(); /* indices of start & end of working section */
        let sig_end = new Array();
        /* check for simple cases */
        if (source.length < 3)
            return (source); /* one or two points */
        /* more complex case. initialize stack */
        n_source = source.length;
        band_sqr = kink * 360.0 / (2.0 * Math.PI * 6378137.0); /* Now in degrees */
        band_sqr *= band_sqr;
        n_dest = 0;
        sig_start[0] = 0;
        sig_end[0] = n_source - 1;
        n_stack = 1;
        /* while the stack is not empty  ... */
        while (n_stack > 0) {
            /* ... pop the top-most entries off the stacks */
            start = sig_start[n_stack - 1];
            end = sig_end[n_stack - 1];
            n_stack--;
            if ((end - start) > 1) { /* any intermediate points ? */
                /* ... yes, so find most deviant intermediate point to
                either side of line joining start & end points */
                x12 = (source[end].lng - source[start].lng);
                y12 = (source[end].lat - source[start].lat);
                if (Math.abs(x12) > 180.0)
                    x12 = 360.0 - Math.abs(x12);
                x12 *= Math.cos(F * (source[end].lat + source[start].lat)); /* use avg lat to reduce lng */
                d12 = (x12 * x12) + (y12 * y12);
                for (i = start + 1, sig = start, max_dev_sqr = -1.0; i < end; i++) {
                    x13 = source[i].lng - source[start].lng;
                    y13 = source[i].lat - source[start].lat;
                    if (Math.abs(x13) > 180.0)
                        x13 = 360.0 - Math.abs(x13);
                    x13 *= Math.cos(F * (source[i].lat + source[start].lat));
                    d13 = (x13 * x13) + (y13 * y13);
                    x23 = source[i].lng - source[end].lng;
                    y23 = source[i].lat - source[end].lat;
                    if (Math.abs(x23) > 180.0)
                        x23 = 360.0 - Math.abs(x23);
                    x23 *= Math.cos(F * (source[i].lat + source[end].lat));
                    d23 = (x23 * x23) + (y23 * y23);
                    if (d13 >= (d12 + d23))
                        dev_sqr = d23;
                    else if (d23 >= (d12 + d13))
                        dev_sqr = d13;
                    else
                        dev_sqr = (x13 * y12 - y13 * x12) * (x13 * y12 - y13 * x12) / d12; // solve triangle
                    if (dev_sqr > max_dev_sqr) {
                        sig = i;
                        max_dev_sqr = dev_sqr;
                    }
                }
                if (max_dev_sqr < band_sqr) { /* is there a sig. intermediate point ? */
                    /* ... no, so transfer current start point */
                    index[n_dest] = start;
                    n_dest++;
                }
                else { /* ... yes, so push two sub-sections on stack for further processing */
                    n_stack++;
                    sig_start[n_stack - 1] = sig;
                    sig_end[n_stack - 1] = end;
                    n_stack++;
                    sig_start[n_stack - 1] = start;
                    sig_end[n_stack - 1] = sig;
                }
            }
            else { /* ... no intermediate points, so transfer current start point */
                index[n_dest] = start;
                n_dest++;
            }
        }
        /* transfer last point */
        index[n_dest] = n_source - 1;
        n_dest++;
        /* make return array */
        let r = new Array();
        for (let j = 0; j < n_dest; j++)
            r.push(source[index[j]]);
        return r;
    }
    static simplify1(source, kink) {
        /* kink	in metres, kinks above this depth kept  */
        /* kink depth is the height of the triangle abc where a-b and b-c are two consecutive line segments */
        kink = kink || 20;
        let n_source, n_stack, n_dest, start, end, i, sig;
        let dev_sqr, max_dev_sqr, band_sqr;
        let x12, y12, d12, x13, y13, d13, x23, y23, d23;
        let F = (Math.PI / 180.0) * 0.5;
        let index = new Array(); /* aray of indexes of source points to include in the reduced line */
        let sig_start = new Array(); /* indices of start & end of working section */
        let sig_end = new Array();
        /* check for simple cases */
        if (source.length < 3)
            return (source); /* one or two points */
        /* more complex case. initialize stack */
        n_source = source.length;
        band_sqr = kink * 360.0 / (2.0 * Math.PI * 6378137.0); /* Now in degrees */
        band_sqr *= band_sqr;
        n_dest = 0;
        sig_start[0] = 0;
        sig_end[0] = n_source - 1;
        n_stack = 1;
        /* while the stack is not empty  ... */
        while (n_stack > 0) {
            /* ... pop the top-most entries off the stacks */
            start = sig_start[n_stack - 1];
            end = sig_end[n_stack - 1];
            n_stack--;
            if ((end - start) > 1) { /* any intermediate points ? */
                /* ... yes, so find most deviant intermediate point to
                either side of line joining start & end points */
                x12 = (source[end].lng - source[start].lng);
                y12 = (source[end].lat - source[start].lat);
                if (Math.abs(x12) > 180.0)
                    x12 = 360.0 - Math.abs(x12);
                x12 *= Math.cos(F * (source[end].lat + source[start].lat)); /* use avg lat to reduce lng */
                d12 = (x12 * x12) + (y12 * y12);
                for (i = start + 1, sig = start, max_dev_sqr = -1.0; i < end; i++) {
                    x13 = source[i].lng - source[start].lng;
                    y13 = source[i].lat - source[start].lat;
                    if (Math.abs(x13) > 180.0)
                        x13 = 360.0 - Math.abs(x13);
                    x13 *= Math.cos(F * (source[i].lat + source[start].lat));
                    d13 = (x13 * x13) + (y13 * y13);
                    x23 = source[i].lng - source[end].lng;
                    y23 = source[i].lat - source[end].lat;
                    if (Math.abs(x23) > 180.0)
                        x23 = 360.0 - Math.abs(x23);
                    x23 *= Math.cos(F * (source[i].lat + source[end].lat));
                    d23 = (x23 * x23) + (y23 * y23);
                    if (d13 >= (d12 + d23))
                        dev_sqr = d23;
                    else if (d23 >= (d12 + d13))
                        dev_sqr = d13;
                    else
                        dev_sqr = (x13 * y12 - y13 * x12) * (x13 * y12 - y13 * x12) / d12; // solve triangle
                    if (dev_sqr > max_dev_sqr) {
                        sig = i;
                        max_dev_sqr = dev_sqr;
                    }
                }
                if (max_dev_sqr < band_sqr) { /* is there a sig. intermediate point ? */
                    /* ... no, so transfer current start point */
                    index[n_dest] = start;
                    n_dest++;
                }
                else { /* ... yes, so push two sub-sections on stack for further processing */
                    n_stack++;
                    sig_start[n_stack - 1] = sig;
                    sig_end[n_stack - 1] = end;
                    n_stack++;
                    sig_start[n_stack - 1] = start;
                    sig_end[n_stack - 1] = sig;
                }
            }
            else { /* ... no intermediate points, so transfer current start point */
                index[n_dest] = start;
                n_dest++;
            }
        }
        /* transfer last point */
        index[n_dest] = n_source - 1;
        n_dest++;
        /* make return array */
        let result = new Array();
        for (let i = 0; i < n_dest; i++)
            result.push(source[index[i]]);
        return result;
    }
    // Todo: This is incorrect implementation. Improve!
    static calculatePerpendicularDistance(point1, point2, point3) {
        let point = {
            lat: (point1.lat + point2.lat) / 2,
            lng: (point1.lng + point2.lng) / 2
        };
        return GeoJsonUtilities.calculateDistance(point, point3);
    }
    static simplifyGeometry(points, tolerance) {
        let dmax = 0;
        let index = 0;
        for (let i = 1; i <= points.length - 2; i++) {
            let d = GeoJsonUtilities.calculatePerpendicularDistance(points[0], points[points.length - 1], points[i]);
            if (d > dmax) {
                index = i;
                dmax = d;
            }
        }
        let results;
        if (dmax > tolerance) {
            let results_one = this.simplifyGeometry(points.slice(0, index), tolerance);
            let results_two = this.simplifyGeometry(points.slice(index, points.length), tolerance);
            results = results_one.concat(results_two);
        }
        else if (points.length > 1) {
            results = [points[0], points[points.length - 1]];
        }
        else {
            results = [points[0]];
        }
        return results;
    }
    static simplifyPath(positions, shortDistance, longDistance, longAngle) {
        let start = 0;
        let maxAngle = geojson.numberToRadius(longAngle || 0);
        // Limit to 100 iterations max
        for (let iteration = 0; iteration < 100; iteration++) {
            let result = [...positions.slice(0, start)];
            let skipped = false;
            for (let index = start; index < positions.length; index++) {
                result.push(positions[index]);
                // Check and skip next point
                if (index < positions.length - 2) {
                    let p1 = positions[index];
                    let p2 = positions[index + 1];
                    let p3 = positions[index + 2];
                    let d1 = GeoJsonUtilities.calculateDistance(p1, p3);
                    // Check for short distance tolerance
                    if (d1 <= shortDistance) {
                        // Additionally check distance to the next point
                        let d2 = GeoJsonUtilities.calculateDistance(p1, p2);
                        // Skip next point if all distances less then tolerance
                        if (d1 > d2) {
                            index++;
                            skipped = true;
                        }
                    }
                    // Check for long distance and angle tolerance
                    else if (d1 < longDistance) {
                        let a1 = this.calculateBearing(p1, p2);
                        let a2 = this.calculateBearing(p2, p3);
                        let da = Math.abs(a1 - a2);
                        // Skip next point if angle less than tolerance
                        if (da < maxAngle) {
                            index++;
                            skipped = true;
                        }
                    }
                }
                if (!skipped)
                    start = index;
            }
            if (skipped)
                positions = result;
            else
                return result;
        }
        return positions;
    }
}
exports.GeoJsonUtilities = GeoJsonUtilities;
//# sourceMappingURL=GeoJsonUtilities.js.map