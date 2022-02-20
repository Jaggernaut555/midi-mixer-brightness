import { createMonitorAssignment, MonitorInfo, refreshOneMonitor } from "./util";
const ddcci = require("@hensm/ddcci");

export function getDDCCI() {
    return ddcci;
}

export async function refreshDdcciMonitorInfo(monitors: Map<string, MonitorInfo>, monitorName?: string) {
    // If we are trying to refresh one monitor we need to return a value for it
    let refreshed = false;

    ddcci._refresh();
    for (const rawmon of ddcci.getMonitorList()) {
        try {
            let mon: string = rawmon

            let info = mon.match("\#(.+?)\#.+\&(.+?)\#");
            if (info === null) {
                log.info(`${info} was not in the expected format`);
                continue;
            }

            let name = `${info[1]} ${info[2]}`;

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

            let brightness = ddcci.getBrightness(mon);

            createMonitorAssignment(monitors, mon, name, brightness, "DDCCI", async (level) => {
                let lev = Math.round(level * 100);
                try {
                    ddcci.setBrightness(mon, lev);
                }
                catch (err) {
                    console.log(err);
                    log.error(err);

                    await refreshOneMonitor(monitors, name, "DDCCI");
                }
            });
        }
        catch (e) {
            log.error(e);
        }
    }

    return refreshed;
}
