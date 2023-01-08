export const command = (command: undefined | null | string | string[]) => {
  if (command === undefined || command === null) {
    return undefined;
  }
  if (!command) {
    return [];
  }
  if (typeof command === "string") {
    const m = command.match(/[^'"\s]+|'(?:\\'|[^'])*'|"(?:\\"|[^"])*"/gu) || [];
    return m.map((m) => {
      const start = m.charAt(0);
      const end = m.charAt(m.length - 1);
      return (start === "'" && end === "'") || (start === '"' && end === '"') ? m.slice(1, -1) : m;
    });
  } else {
    return command;
  }
};
