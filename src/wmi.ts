import { PowerShell } from 'node-powershell'
import { createMonitorAssignment, MonitorInfo, refreshOneMonitor } from './util';

const ps = new PowerShell({
    debug: false,
    executableOptions: {
        '-ExecutionPolicy': 'Bypass',
        '-NoProfile': true,
    },
});

interface PsMonitor {
    InstanceName: string,
    CurrentBrightness: number,
    Active: boolean
}

export async function refreshWmiMonitorInfo(monitors: Map<string, MonitorInfo>, monitorName?: string) {
    let refreshed = false;
    let cmd = `(Get-WmiObject -Namespace root/WMI -Class WmiMonitorBrightness -Property InstanceName,Active,CurrentBrightness) | ConvertTo-Json`

    try {
        let r = await ps.invoke(cmd);

        let s = r.stdout?.toString() ?? "{}";

        // May be one or many PsMonitor objects
        let mons: PsMonitor[] = JSON.parse(s);

        if (!Array.isArray(mons)) {
            console.log("Converting single WMI monitor to array");
            mons = [mons as PsMonitor];
        }

        for (let mon of mons) {
            if (mon.Active) {
                let info = mon.InstanceName.match(/\\(.+?)\\.+\&(.+?)_0/);

                if (info === null) {
                    log.info(`${mon} was not in the expected format`);
                    console.log(`${mon} was not in the expected format`);
                    continue;
                }

                let name = `${info[1]} ${info[2]} WMI`;

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

                createMonitorAssignment(monitors, mon.InstanceName, name, mon.CurrentBrightness, "WMI", async (level) => {
                    try {
                        await setWMIBrightness(mon.InstanceName, level);
                    }
                    catch (err) {
                        console.log(err);
                        log.error(err);

                        await refreshOneMonitor(monitors, name, "WMI");
                    }
                })
            }
        }
    }
    catch (err) {
        // Err here likely caused by unsupported WMI platform. Fine to ignore
        console.log(err);
    }

    return refreshed;
}

async function setWMIBrightness(id: string, level: number) {
    let lev = Math.round(level * 100);

    let escapedId = id.replace(/\\/g, '\\\\')

    const cmd = `(Get-WmiObject -Namespace root/WMI -Class WmiMonitorBrightnessMethods -Filter "InstanceName='${escapedId}'").WmiSetBrightness(0, ${lev})`

    await ps.invoke(cmd);
    // On success no important return value
}
