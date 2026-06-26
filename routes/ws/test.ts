import { Handlers } from "$fresh/server.ts";

export const handler: Handlers = {
  GET(req) {
    if (req.headers.get("upgrade") !== "websocket") {
      return new Response(null, { status: 501 });
    }
    const { socket, response } = Deno.upgradeWebSocket(req);
    socket.onopen = () => {
      console.log("WebSocket connection established.");
      socket.send(JSON.stringify({ message: "Hello from Deno WS!" }));
    };
    socket.onmessage = (e) => {
      console.log("WebSocket message received:", e.data);
      socket.send(JSON.stringify({ echo: e.data }));
    };
    socket.onclose = () => console.log("WebSocket closed.");
    socket.onerror = (e) => console.error("WebSocket error:", e);
    return response;
  },
};
