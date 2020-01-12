export declare class GeoJsonUtilities {
    static calculateDistance(pos1: any, pos2: any): number;
    static calculateBearing(pos1: any, pos2: any): number;
    static simplify(source: any[], kink?: number): any[];
    static simplify1(source: any[], kink?: number): any[];
    private static calculatePerpendicularDistance;
    static simplifyGeometry(points: any, tolerance: any): any;
    static simplifyPath(positions: any[], shortDistance: number, longDistance: number, longAngle: number): any[];
}
