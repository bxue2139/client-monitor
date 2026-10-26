Client monitor shows how many Paseo clients are connected to a daemon right now. A sidebar row and a footer item show the count of online external clients; the row opens a full page with the client list, their app versions, when each connected or dropped, and the latest connects and disconnects, and the footer item opens the same list as a popover. A toast appears when a device the daemon log has never shown before connects.

Install the plugin on every host you want to watch. When more than one host has it, the full page shows Paseo's host picker, and the sidebar items follow the host chosen there.

External clients are the web app, desktop apps on other machines and phones, which all reach the daemon through relay.paseo.sh. Local clients are apps and the CLI on the daemon's own machine. Plugin processes are not listed.

The plugin reads the daemon's own log, `daemon.log` in the Paseo home (`PASEO_HOME`, or `~/.paseo`), and its rotated copies. Each client appears under the client ID the daemon logs; Paseo does not log device names or IP addresses for relay clients. After a socket drops, the daemon waits about 90 seconds for the client to come back, shown as reconnecting. The daemon's own session totals, written every 30 seconds, are shown at the bottom of the list. Nothing is sent anywhere.
