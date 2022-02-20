import { PowerShell } from 'node-powershell'
import { createMonitorAssignment, MonitorInfo } from './util';

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

export async function refreshWmiMonitorInfo(monitors: Map<string, MonitorInfo>) {
    let cmd = `(Get-WmiObject -Namespace root/WMI -Class WmiMonitorBrightness -Property InstanceName,Active,CurrentBrightness) | ConvertTo-Json`

    try {
        let r = await ps.invoke(cmd);

        let s = r.stdout?.toString() ?? "{}";
        let mons: PsMonitor[] = JSON.parse(s);
        for (let mon of mons) {
            if (mon.Active) {

                let info = mon.InstanceName.match(/\\(.+?)\\.+\&(.+?)_0/);

                if (info === null) {
                    log.info(`${info} was not in the expected format`);
                    console.log(`${info} was not in the expected format`)
                    return;
                }

                let name = `${info[1]} ${info[2]} WMI`;

                createMonitorAssignment(monitors, mon.InstanceName, name, mon.CurrentBrightness, "WMI", async (level) => {
                    await setWMIBrightness(mon.InstanceName, level);
                })
            }
        }
    }
    catch (err) {
        // Err here likely caused by unsupported WMI platform. Fine to ignore
        console.log(err);
    }
}

async function setWMIBrightness(id: string, level: number) {
    let lev = Math.round(level * 100);

    let escapedId = id.replace(/\\/g, '\\\\')

    const cmd = `(Get-WmiObject -Namespace root/WMI -Class WmiMonitorBrightnessMethods -Filter "InstanceName='${escapedId}'").WmiSetBrightness(0, ${lev})`

    try {
        await ps.invoke(cmd);
        // On success no important return value
    }
    catch (err) {
        log.error(err)
        console.log(err);
        $MM.showNotification("Error changing WMI brightness");
        return;
    }
}