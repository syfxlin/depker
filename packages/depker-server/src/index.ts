import { Server } from "socket.io";
import { routes } from "./routes";

const io = new Server();

routes(io);

io.listen(3000);
console.log(`Server started!`);
