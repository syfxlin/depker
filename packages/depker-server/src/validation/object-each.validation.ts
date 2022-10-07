import { EachValidRule } from "./common.validation";
import { isObject, registerDecorator, ValidationArguments, ValidationOptions } from "class-validator";

export const objectEach = (rules: Record<string, Array<EachValidRule>>) => {
  return async (value: any) => {
    if (!isObject(value)) {
      return false;
    }
    for (const [p, rs] of Object.entries(rules)) {
      for (const r of rs) {
        const result = await r((value as any)[p], value);
        if (!result) {
          return false;
        }
      }
    }
    return true;
  };
};

export const ObjectEach = (rules: Record<string, Array<EachValidRule>>, options?: ValidationOptions) => {
  return (object: any, property: string) => {
    registerDecorator({
      name: "objectEach",
      target: object.constructor,
      propertyName: property,
      constraints: [property],
      options: options,
      validator: {
        validate: async (value: any) => {
          return await objectEach(rules)(value);
        },
        defaultMessage(args?: ValidationArguments) {
          return `${args?.property} is not validated`;
        },
      },
    });
  };
};
