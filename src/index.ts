import { Assignment, ButtonType } from "midi-mixer-plugin";
import { refreshDdcciMonitorInfo } from "./ddcci";
import { MonitorInfo, refreshMonitors } from "./util";
import { refreshWmiMonitorInfo } from "./wmi";

const monitors = new Map<string, MonitorInfo>()

const refreshButton: ButtonType = new ButtonType("Refresh Monitors", {
  name: "Refresh Monitor List",
  active: true,
});

refreshButton.on("pressed", () => {
  refreshMonitors(monitors);
});

async function init() {
  refreshMonitors(monitors);
}

init();
