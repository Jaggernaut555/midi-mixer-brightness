import { Assignment } from "midi-mixer-plugin";
import { getDDCCI, refreshDdcciMonitorInfo, toggleMonitorState } from "./ddcci";
import { refreshWmiMonitorInfo } from "./wmi";

export type Protocol = "DDCCI" | "WMI";

export interface MonitorInfo {
  Id: string;
  Name: string;
  InitialBrightness: number;
  Assignment: Assignment;
  protocol: Protocol;
}

export async function refreshMonitors(
  monitors: Map<string, MonitorInfo>
): Promise<void> {
  monitors.clear();
  await refreshDdcciMonitorInfo(monitors);
  await refreshWmiMonitorInfo(monitors);
  $MM.setSettingsStatus(
    "brightnessStatus",
    `${monitors.size} monitor(s) detected`
  );
  $MM.showNotification("Refreshed Brightness plugin monitor list");
}

export function createMonitorAssignment(
  monitors: Map<string, MonitorInfo>,
  id: string,
  name: string,
  initial: number,
  protocol: Protocol,
  volumeCallback: (level: number) => void,
  throttle = 50
): void {
  const m: MonitorInfo = {
    Id: id,
    Name: name,
    Assignment: new Assignment(`Brightness ${name}`, {
      name: name,
      muted: true, // light up the mute button
      volume: initial / 100,
      throttle: throttle,
      assigned: true,
      running: true,
    }),
    InitialBrightness: initial,
    protocol,
  };

  m.Assignment.on("volumeChanged", (level: number) => {
    volumeCallback(level);
    m.Assignment.volume = level;
  });

  m.Assignment.on("mutePressed", () => {
    // Reset back to initial/default brightness
    m.Assignment.emit("volumeChanged", m.InitialBrightness / 100);
  });

  if (protocol == "DDCCI") {
    m.Assignment.on("runPressed", () => {
      toggleMonitorState(m);
    });
  }

  monitors.set(m.Name, m);
}

export async function refreshOneMonitor(
  monitors: Map<string, MonitorInfo>,
  name: string,
  protocol: Protocol
): Promise<void> {
  let found = false;

  if (protocol === "DDCCI") {
    found = await refreshDdcciMonitorInfo(monitors, name);
  } else if (protocol === "WMI") {
    found = await refreshWmiMonitorInfo(monitors, name);
  }

  if (!found) {
    console.log("Could not refresh monitor");
  }
}

// Until any of thee below features are implemented this is not useful.
/*
async function createMainControl() {
  // average monitors to get default brightness
  // could keep these offsets?
  // with the addition of multi-assignments, this is not very useful without keeping offsets
  // being able to update settings fields from the plugin would make this more useful
  // e.g.
  // - detect 3 monitors
  // - add a field to settings for default (and offset) for each monitor
  // - user can set their preferences for each monitor there
  let sum = 0;
  for (const m of monitors) {
    sum += m[1].Assignment.volume;
  }
  let avg = sum / monitors.size;

  mainControl = {
    Id: "Main control",
    Name: "Main Control",
    Assignment: new Assignment("Main Control", {
      name: "Main Control",
      muted: true,
      volume: avg,
    }),
    InitialBrightness: avg * 100,
  };

  mainControl.Assignment.on("volumeChanged", (level: number) => {
    mainControl.Assignment.volume = level;
    monitors.forEach((v, k) => {
      v.Assignment.emit("volumeChanged", level);
    });
  });

  mainControl.Assignment.on("mutePressed", () => {
    mainControl.Assignment.volume = mainControl.InitialBrightness / 100;
    monitors.forEach((v, k) => {
      v.Assignment.emit("mutePressed");
    })
  });
}
*/
