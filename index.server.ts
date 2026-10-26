import type { PluginServerContext } from "@getpaseo/plugin/server";
import { startLogFollower } from "./server/log-follower";
import { connectionsRpc } from "./shared/connections";

export default function contribute(server: PluginServerContext) {
  const follower = startLogFollower();
  server.handle(connectionsRpc, () => follower.read());
  return () => follower.stop();
}
