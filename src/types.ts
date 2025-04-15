export type DataType = 'String' | 'Boolean' | 'Integer' | 'Real' | 'Array' | 'Object';

export interface ArrayRestrictions {
  value: SchemaValue;
}

export interface ObjectRestrictions {
  values: Record<string, SchemaValue>;
}

export interface SchemaValue {
  dataType: DataType;
  arrayRestrictions?: ArrayRestrictions;
  objectRestrictions?: ObjectRestrictions;
}

export interface Schema {
  value: SchemaValue;
}
