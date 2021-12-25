import { events } from "../src/events";

test("event", async () => {
  events.on("test", async () => {
    console.log("test1");
    await new Promise<void>((resolve) => {
      setTimeout(resolve, 2000);
    });
    console.log("test3");
  });
  events.on("test", async () => {
    console.log("test2");
  });
  events.emit("test");
  console.log("test4");
});
