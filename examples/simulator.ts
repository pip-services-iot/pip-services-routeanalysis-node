let _ = require('lodash');
let async = require('async');
let restify = require('restify');

import { RandomInteger } from 'pip-services3-commons-node';
import { RandomFloat } from 'pip-services3-commons-node';

class Simulator {  
    private _objectId: string = '1';
    private _orgId: string = '1';
    private _lat: number = 32.3940;
    private _lng: number = -110.9865;
    private _time = new Date(2018, 0, 1);
    private _rest: any;

    public constructor() {
        let url = 'http://localhost:8080';
        this._rest = restify.createJsonClient({ url: url, version: '*' });
    }

    private nextTime(seconds: number): void {
        this._time = new Date(this._time.getTime() + seconds * 1000);
    }

    private nextPosition(dlat: number, dlng: number): void {
        this._lat += dlat;
        this._lng += dlng;
    }

    private sendPosition(callback: (err: any) => void): void {
        console.log("Position time: " + this._time + " lat: " + this._lat + " lng: " + this._lng);

        this._rest.post('/route_analysis/add_positions',
            {
                positions: [ { 
                    org_id: this._orgId,
                    object_id: this._objectId,
                    time: this._time,
                    lat: this._lat,
                    lng: this._lng
                } ]
            },
            (err, req, res) => {
                if (err) callback(err);
                else setTimeout(callback, 500);
            }
        );

        //setTimeout(callback, 500);
    }

    private getCurrentRoute(): void {
        console.log("Get current route");

        let toTime = new Date(this._time.getTime() - 2*60*1000);
        let fromTime = new Date(toTime.getTime() - 3*60*1000);
        this._rest.post('/route_analysis/get_current_route',
        {
            object_id: this._objectId,
            from_time: fromTime.toISOString(),
            to_time: toTime.toISOString()
        },
            (err, req, res) => {
                console.log("Get current route1 from: " +  fromTime.toISOString() + " toTime: " + toTime.toISOString(), res ? res.body : 'empty');
            }
        );
    }

    public run(): void {
        async.forever((next) => {
            let action = RandomInteger.nextInteger(0, 3);
            let duration = 0;
            let step = 0;
            let dlat = 0;
            let dlng = 0;

            // Stop
            if (action == 0) {
                console.log("Stopping...");
                duration = 600;
                step = 30
            }
            // Stay
            else if (action == 1) {
                console.log("Staying...");
                duration = 1000;
                step = 60;
            }
            // Moving
            else {
                console.log("Traveling...");            
                duration = RandomInteger.nextInteger(60, 900);
                step = 15;
                dlat = RandomFloat.nextFloat(-0.0001, 0.0001);
                dlng = RandomFloat.nextFloat(-0.0001, 0.0001);
            }
            this.getCurrentRoute();
            async.whilst(
                () => duration > 0,
                (callback) => {
                    duration -= step;

                    this.nextTime(step);
                    this.nextPosition(dlat, dlng);
                    this.sendPosition(callback);
                },
                (err) => {
                    next(err);
                }
            );
        },
        (err) => {
            console.error(err);
        });
    }
}

new Simulator().run();