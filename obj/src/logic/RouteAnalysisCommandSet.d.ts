import { CommandSet } from 'pip-services3-commons-node';
import { IRouteAnalysisController } from './IRouteAnalysisController';
export declare class RouteAnalysisCommandSet extends CommandSet {
    private _logic;
    constructor(logic: IRouteAnalysisController);
    private makeGetCurrentRoutesCommand;
    private makeGetCurrentRouteCommand;
    private makeAddPositionCommand;
    private makeAddPositionsCommand;
}
