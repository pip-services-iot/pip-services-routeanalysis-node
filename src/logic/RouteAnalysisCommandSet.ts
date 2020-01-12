import { CommandSet } from 'pip-services3-commons-node';
import { ICommand } from 'pip-services3-commons-node';
import { Command } from 'pip-services3-commons-node';
import { Schema } from 'pip-services3-commons-node';
import { Parameters } from 'pip-services3-commons-node';
import { FilterParams } from 'pip-services3-commons-node';
import { PagingParams } from 'pip-services3-commons-node';
import { ObjectSchema } from 'pip-services3-commons-node';
import { ArraySchema } from 'pip-services3-commons-node';
import { TypeCode } from 'pip-services3-commons-node';
import { FilterParamsSchema } from 'pip-services3-commons-node';
import { PagingParamsSchema } from 'pip-services3-commons-node';
import { DateTimeConverter } from 'pip-services3-commons-node';

import { ObjectPositionV1 } from '../data/version1/ObjectPositionV1';
import { ObjectPositionV1Schema } from '../data/version1/ObjectPositionV1Schema';
import { IRouteAnalysisController } from './IRouteAnalysisController';

export class RouteAnalysisCommandSet extends CommandSet {
    private _logic: IRouteAnalysisController;

    constructor(logic: IRouteAnalysisController) {
        super();

        this._logic = logic;

        // Register commands to the database
		this.addCommand(this.makeGetCurrentRoutesCommand());
		this.addCommand(this.makeGetCurrentRouteCommand());
		this.addCommand(this.makeAddPositionCommand());
		this.addCommand(this.makeAddPositionsCommand());
    }

	private makeGetCurrentRoutesCommand(): ICommand {
		return new Command(
			"get_current_routes",
			new ObjectSchema(true)
				.withOptionalProperty('filter', new FilterParamsSchema())
				.withOptionalProperty('paging', new PagingParamsSchema()),
            (correlationId: string, args: Parameters, callback: (err: any, result: any) => void) => {
                let filter = FilterParams.fromValue(args.get("filter"));
                let paging = PagingParams.fromValue(args.get("paging"));
                this._logic.getCurrentRoutes(correlationId, filter, paging, callback);
            }
		);
	}
	
	private makeGetCurrentRouteCommand(): ICommand {
		return new Command(
			"get_current_route",
			new ObjectSchema(true)
				.withRequiredProperty('object_id', TypeCode.String)
				.withOptionalProperty('from_time', null) // TypeCode.Date
				.withOptionalProperty('to_time', null) // TypeCode.DateTime
				.withOptionalProperty('compress', TypeCode.Long), 
            (correlationId: string, args: Parameters, callback: (err: any, result: any) => void) => {
				let objectId = args.getAsNullableString("object_id");
				let fromTime = args.getAsNullableDateTime("from_time");
				let toTime = args.getAsNullableDateTime("to_time");
                this._logic.getCurrentRoute(correlationId, objectId, fromTime, toTime, callback);
            }
		);
	}
	
	private makeAddPositionCommand(): ICommand {
		return new Command(
			"add_position",
			new ObjectSchema(true)
                .withRequiredProperty('position', new ObjectPositionV1Schema()),
            (correlationId: string, args: Parameters, callback: (err: any, result: any) => void) => {
                let position = args.get("position");
			    this._logic.addPosition(correlationId, position, (err) => {
				   	if (callback) callback(err, null);
			   });
            }
		);
	}

	private makeAddPositionsCommand(): ICommand {
		return new Command(
			"add_positions",
			new ObjectSchema(true)
				.withRequiredProperty('positions', new ArraySchema(new ObjectPositionV1Schema())),
            (correlationId: string, args: Parameters, callback: (err: any, result: any) => void) => {
                let positions = args.get("positions");
			    this._logic.addPositions(correlationId, positions, (err) => {
				   	if (callback) callback(err, null);
			   });
            }
		);
	}
	
}