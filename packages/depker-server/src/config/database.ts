import Loki from "lokijs";
import { dir } from "./dir";

export const database = new Loki(dir.database, {
  adapter: new Loki.LokiFsAdapter(),
  autoload: true,
  autosave: true,
  autoloadCallback: () => {
    if (!database.getCollection("tokens")) {
      database.addCollection("tokens");
    }
    if (!database.getCollection("secrets")) {
      database.addCollection("secrets");
    }
  },
});

export const secret = (value: string) => {
  const collection = database.getCollection("secrets");
  return value.replace(/\${(\w+)}/g, ($0, $1) => {
    return collection.findOne({ name: $1 })?.value ?? $0;
  });
};
