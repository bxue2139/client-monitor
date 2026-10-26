import type { PluginClientContext } from "@getpaseo/plugin/client";
import { SCREEN_ID, ConnectionsScreen } from "./client/screen";
import { ClientCountItem, ClientsNavItem } from "./client/sidebar";

export default function contribute(client: PluginClientContext) {
  client.addScreen({ id: SCREEN_ID, title: "外部連線", Component: ConnectionsScreen });
  client.addSidebarHeaderItem({ id: "clients", title: "外部連線", Component: ClientsNavItem });
  client.addSidebarFooterItem({ id: "client-count", title: "外部連線（底部）", Component: ClientCountItem });
  return () => {};
}
