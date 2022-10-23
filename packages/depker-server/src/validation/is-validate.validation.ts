import { registerDecorator, ValidationArguments, ValidationOptions } from "class-validator";

export const IsValidate = (
  fn: (value: any, object: any, args?: ValidationArguments) => boolean | Promise<boolean>,
  options?: ValidationOptions
) => {
  return (object: any, property: string) => {
    registerDecorator({
      name: "isValidate",
      target: object.constructor,
      propertyName: property,
      constraints: [property],
      async: true,
      options: {
        message: (args) => `${args.property} is not validate`,
        ...options,
      },
      validator: {
        validate: (value: any, args?: ValidationArguments) => fn(value, object, args),
      },
    });
  };
};
