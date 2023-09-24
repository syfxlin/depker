import "https://deno.land/std@0.192.0/dotenv/load.ts";
import { Depker } from "./mod.ts";

const depker = await Depker.create();
await depker.execute();
