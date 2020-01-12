import { ObjectSchema } from 'pip-services3-commons-node';
import { ArraySchema } from 'pip-services3-commons-node';
import { TypeCode } from 'pip-services3-commons-node';

export class ObjectPositionV1Schema extends ObjectSchema {
    public constructor() {
        super();
        this.withRequiredProperty('org_id', TypeCode.String);
        this.withRequiredProperty('object_id', TypeCode.String);
        this.withRequiredProperty('time', TypeCode.DateTime);
        this.withRequiredProperty('lat', TypeCode.Float);
        this.withRequiredProperty('lng', TypeCode.Float);
        this.withOptionalProperty('alt', TypeCode.Float);
        this.withOptionalProperty('speed', TypeCode.Float);
        this.withOptionalProperty('angle', TypeCode.Float);
    }
}
