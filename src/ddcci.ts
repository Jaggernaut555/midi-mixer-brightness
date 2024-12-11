import { createMonitorAssignment, MonitorInfo, refreshOneMonitor } from "./util";
const ddcci = require("@hensm/ddcci");

export function getDDCCI() {
  return ddcci;
}

export async function refreshDdcciMonitorInfo(monitors: Map<string, MonitorInfo>, monitorName?: string) {
  // If we are trying to refresh one monitor we need to return a value for it
  let refreshed = false;

  ddcci._refresh();

  const monitorList = ddcci.getMonitorList();
  console.log("DDC/CI monitors:", monitorList);

  for (const rawmon of monitorList) {
    try {
      const mon: string = rawmon;

      const info = mon.match("\#(.+?)\#.+\&(.+?)\#");
      if (info === null) {
        log.info(`${mon} was not in the expected format`);
        console.log(`${mon} was not in the expected format`);
        continue;
      }

      const name = `${info[1]} ${info[2]}`;

      // If we are refreshing one monitor
      if (monitorName) {
        if (monitorName !== name) {
          continue;
        }

        // m.Assignment.remove();
        monitors.delete(name);
        console.log("Refreshing one monitor");
      }

      refreshed = true;

      const brightness = ddcci.getBrightness(mon);

      createMonitorAssignment(
        monitors,
        mon,
        name,
        brightness,
        "DDCCI",
        async (level) => {
          const lev = Math.round(level * 100);
          try {
            ddcci.setBrightness(mon, lev);
          } catch (err) {
            console.log(err);
            log.error(err);

            await refreshOneMonitor(monitors, name, "DDCCI");
          }
        }
      );
    } catch (e) {
      log.error(`Error in DDC/CI refresh with monitor ${rawmon}`, e);
      console.log(`Error in DDC/CI refresh with monitor ${rawmon}`, e);
    }
  }

  return refreshed;
}

export function toggleMonitorState(info: MonitorInfo): void {
  try {
    // vcp code d6 is POWER_MODE
    const state = ddcci._getVCP(info.Id, 0xd6); // [currentvalue, maxvalue]
    // state[0] being 1 is on
    // writing 5 to this vcp code is a write-only value to turn the monitor off
    if (state) {
      if (state[0] == 1) ddcci._setVCP(info.Id, 0xd6, 5);
      else ddcci._setVCP(info.Id, 0xd6, 1);
    }
  } catch (e) {
    console.error(e);
  }
}
