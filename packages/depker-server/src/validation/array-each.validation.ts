import { EachValidRule } from "./common.validation";
import { isArray, registerDecorator, ValidationArguments, ValidationOptions } from "class-validator";

export const arrayEach = (rules: Array<EachValidRule>) => {
  return async (value: any[]) => {
    if (!isArray(value)) {
      return false;
    }
    for (const item of value) {
      for (const rule of rules) {
        const result = await rule(item, value);
        if (!result) {
          return false;
        }
      }
    }
    return true;
  };
};

export const ArrayEach = (rules: Array<EachValidRule>, options?: ValidationOptions) => {
  return (object: any, property: string) => {
    registerDecorator({
      name: "arrayEach",
      target: object.constructor,
      propertyName: property,
      constraints: [property],
      options: options,
      validator: {
        validate: async (value: any[]) => {
          return await arrayEach(rules)(value);
        },
        defaultMessage(args?: ValidationArguments) {
          return `${args.property} is not validated`;
        },
      },
    });
  };
};
