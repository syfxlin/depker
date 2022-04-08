const decoder = new TextDecoder();
const encoder = new TextEncoder();

export const decode = (input: ArrayBufferView | ArrayBuffer) => {
  return decoder.decode(input);
};

export const encode = (input: string) => {
  return encoder.encode(input);
};
