import { EachValidRule } from "./common.validation";
import { isObject, registerDecorator, ValidationArguments, ValidationOptions } from "class-validator";

export const recordEach = (keys?: Array<EachValidRule>, values?: Array<EachValidRule>) => {
  return async (value: any) => {
    if (!isObject(value)) {
      return false;
    }
    for (const [k, v] of Object.entries(value)) {
      if (keys) {
        for (const rule of keys) {
          const result = await rule(k, v);
          if (!result) {
            return false;
          }
        }
      }
      if (values) {
        for (const rule of values) {
          const result = await rule(k, v);
          if (!result) {
            return false;
          }
        }
      }
    }
    return true;
  };
};

export const RecordEach = (keys?: Array<EachValidRule>, values?: Array<EachValidRule>, options?: ValidationOptions) => {
  return (object: any, property: string) => {
    registerDecorator({
      name: "recordEach",
      target: object.constructor,
      propertyName: property,
      constraints: [property],
      options: options,
      validator: {
        validate: async (value: any) => {
          return await recordEach(keys, values)(value);
        },
        defaultMessage(args?: ValidationArguments) {
          return `${args.property} is not validated`;
        },
      },
    });
  };
};
