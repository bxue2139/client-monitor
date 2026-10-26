# client-monitor

[繁體中文](README.zh-TW.md)

A Paseo plugin that shows, live, how many clients are connected to a Paseo daemon, and which ones.

Paseo lets you reach a daemon from the web app (app.paseo.sh), desktop apps and phones through relay.paseo.sh, but it does not tell you who is connected right now. This plugin does: it puts the count in the sidebar, lists every client with its state and app version, and warns you when a device the daemon has never seen before connects.

## Features

- **Sidebar row "外部連線"** with a badge: the number of external clients online, plus `+N` for clients that are reconnecting. Opens the full page.
- **Full page** with every client of the selected host: external clients, local clients, recently disconnected clients, the latest connect and disconnect events, and the daemon's own session totals.
- **Host picker.** When the plugin is installed on more than one host, Paseo shows its host picker at the top of the full page. The sidebar row and footer item follow the host you pick there.
- **Footer item** with the same count. Opens a compact popover with the same list and a button to the full page.
- **New device toast.** When a client ID that the daemon log has never shown connects, a warning toast names the host and the device. Clients already known when you open the app do not trigger it.
- **Copy a client ID** by selecting its row.

The interface is in Traditional Chinese.

### What the states mean

| State | Meaning |
|---|---|
| 在線 (online) | The client has an open session with the daemon. |
| 重連中 (reconnecting) | The socket dropped. The daemon keeps the session for about 90 seconds in case the client comes back. |
| 離線 (offline) | The session has ended, or the daemon worker restarted. |

Client kinds:

- **External**: the web app, desktop apps on other machines, and the iOS and Android apps. They all reach the daemon through relay.paseo.sh.
- **Local**: apps and the `paseo` CLI on the daemon's own machine.
- **Plugin processes** also hold connections to the daemon. They are counted in the daemon's totals but never listed.

## Requirements

- Paseo daemon 0.13.0 or later.
- **Enable plugins** turned on in Settings → Plugins on each host where you install it.
- The plugin only uses Node's standard library and path handling that works on any OS. It has been tested on Windows.

## Install

Install the plugin on **every host you want to watch**. It reads the log of the daemon it runs on, so a host without the plugin cannot be monitored and does not appear in the host picker.

1. Extract `client-monitor-<version>.zip` to a folder you will keep, for example `~/paseo-plugins/`. Paseo runs the plugin from that folder, so do not move or delete it after installing.
2. Install the extracted `client-monitor` folder by its absolute path. No `npm install` is needed: Paseo supplies the plugin SDK, React, React Native, TanStack Query and Zod at runtime.

   ```sh
   paseo plugin install /absolute/path/to/client-monitor
   ```

   On Windows, quote paths that contain spaces:

   ```powershell
   paseo plugin install "C:\Users\you\paseo-plugins\client-monitor"
   ```

   You can also paste the same path into Settings → Plugins → Plugin source and select **Install plugin**.

3. Check that it is running:

   ```sh
   paseo plugin ls
   paseo plugin logs client-monitor
   ```

   The log should end with a line like `[client-monitor] following /home/you/.paseo/daemon.log from byte 123456`.

Paseo's `npm:` source only accepts packages from the npm registry, so a local `.tgz` cannot be installed. Use the folder.

### Update

Remove the old version, then install the new folder:

```sh
paseo plugin remove client-monitor
paseo plugin install /absolute/path/to/new/client-monitor
```

### Remove

```sh
paseo plugin remove client-monitor
```

You can also hide the sidebar row or the footer item separately in Paseo's sidebar settings. The new device toast comes from the footer item, so hiding the footer item also turns the toast off.

## How it works

Paseo's plugin SDK has no API for client connections, so the plugin reads what the daemon already writes to its log.

- **Server side** (a daemon subprocess): on start it reads the three most recent rotated logs listed in `daemon.log.txt`, then `daemon.log`, to rebuild the current state. After that it checks `daemon.log` for new lines every second. When the daemon rotates the log, it finishes reading the renamed file before following the new one, so no event is lost.
- **Events it reads**:
  - `Client connected via hello` → the client is online.
  - `Client disconnected; waiting for reconnect` → the client is reconnecting.
  - `ws_runtime_metrics`, written every 30 seconds → the daemon's totals. When it reports no session waiting for reconnect, reconnecting clients become offline.
- A client's state follows its most recent socket, so a late disconnect from a socket the client already replaced is ignored. If a client stays in reconnecting for more than 3 minutes without a metrics line, it becomes offline anyway.
- **Client side** (every Paseo app): asks the host's plugin for a snapshot every 2 seconds, separately for each host.

The log is found at `$PASEO_HOME/daemon.log`, or `~/.paseo/daemon.log` when `PASEO_HOME` is not set.

## Privacy

The plugin only reads the local daemon log and serves the result to Paseo clients of that same daemon. It sends nothing anywhere else and writes no files.

## Limitations

- **No device names or IP addresses.** For relay clients the daemon only logs a client ID and the app version. A client ID stays the same across reconnects of the same app, so an ID you do not recognize is usually a new browser or device, or one whose app data was cleared.
- **Totals can lag by up to 30 seconds**, because the daemon writes its metrics every 30 seconds. Individual connects and disconnects show up within 1 to 2 seconds.
- **It depends on Paseo's log format.** If a future Paseo version changes these log messages, the counts may stop updating until the plugin is updated.
- The daemon calls its total `externalSessionKeys`, but it counts every non-plugin client session, local and reconnecting ones included. The plugin labels it accordingly.
- The event list keeps the 50 most recent connects and disconnects of external and local clients.

## Development

```sh
npm install        # type definitions and test tooling only
npm test           # unit tests for the log tracker (Node 22.6+ runs TypeScript directly)
npm run typecheck
paseo plugin reload client-monitor
```

| Path | Purpose |
|---|---|
| `index.server.ts` | Starts the log follower and serves the `connections.snapshot` RPC. |
| `server/log-follower.ts` | Reads the rotated logs, follows `daemon.log`, and handles rotation. |
| `server/tracker.ts` | Turns log lines into client states and events. Has no Node imports, so it is unit tested directly. |
| `server/tracker.test.ts` | Tests for the tracker. Not included in the package. |
| `shared/connections.ts` | The RPC contract shared by server and client. |
| `index.client.tsx` | Registers the screen, the sidebar row and the footer item. |
| `client/screen.tsx` | The full page. |
| `client/sidebar.tsx` | The sidebar row, the footer item, the popover and the new device toast. |
| `client/view.tsx` | The client list and events, shared by the page and the popover. |

To build the distributable zip, run `npm pack` and zip the extracted `package` folder renamed to `client-monitor`.
