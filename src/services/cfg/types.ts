export type Value = string | number | boolean | null | Value[] | { [key: string]: Value };

export type Configs = Partial<{ [name: string]: Record<string, Value> }>;

export type Secrets = Partial<{ [name: string]: string | number | boolean | null }>;
