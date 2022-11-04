export const stdcopy = (buffer: Buffer) => {
  const prefix = 8;
  const output: [0 | 1, Buffer][] = [];
  while (true) {
    if (buffer.length < prefix) {
      break;
    }
    const type = buffer[0] <= 2 ? 0 : 1;
    const length = buffer.readUInt32BE(4);
    output.push([type, buffer.subarray(prefix, Math.min(prefix + length, buffer.length))]);
    buffer = buffer.subarray(Math.min(prefix + length, buffer.length));
  }
  return output;
};
