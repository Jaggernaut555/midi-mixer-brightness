import { Assignment, ButtonType } from "midi-mixer-plugin";
import { refreshDdcciMonitorInfo } from "./ddcci";
import { MonitorInfo, refreshMonitors } from "./util";
import { refreshWmiMonitorInfo } from "./wmi";

let monitors = new Map<string, MonitorInfo>()

let refreshButton: ButtonType = new ButtonType("Refresh Monitors", {
  name: "Refresh Monitor List",
  active: true,
});

refreshButton.on("pressed", () => {
  refreshMonitors(monitors);
  $MM.setSettingsStatus("brightnessStatus", `${monitors.size} monitor(s) detected`);
});

async function init() {
  await refreshDdcciMonitorInfo(monitors);
  await refreshWmiMonitorInfo(monitors);
  $MM.setSettingsStatus("brightnessStatus", `${monitors.size} monitor(s) detected`);
}


init();
