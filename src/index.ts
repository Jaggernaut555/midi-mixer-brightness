import { Assignment, ButtonType } from "midi-mixer-plugin";
import { exec } from 'child_process';
const ddcci = require("@hensm/ddcci");

interface monitorInfo {
  Id: string;
  Name: string;
  InitialBrightness: number;
  Assignment: Assignment;
};

let monitors = new Map<string, monitorInfo>()
let refreshButton: ButtonType = new ButtonType("Refresh Monitors", {
  name: "Refresh Monitor List",
  active: true,
});

refreshButton.on("pressed", () => {
  ddcci._refresh();
  refreshDdcciMonitorInfo();
  refreshWmiMonitorInfo();
  $MM.showNotification("Refreshed Brightness plugin monitor list");
});

async function refreshDdcciMonitorInfo() {
  monitors.clear();

  for (const rawmon of ddcci.getMonitorList()) {
    try {
      let mon: string = rawmon

      let info = mon.match("\#(.+?)\#.+\&(.+?)\#");
      if (info === null) {
        log.info(`${info} was not in the expected format`);
        continue;
      }

      let name = `${info[1]} ${info[2]}`;
      let brightness = ddcci.getBrightness(mon);

      createMonitorAssignment(mon, name, brightness, (level) => {
        let lev = Math.round(level * 100);
        ddcci.setBrightness(mon, lev);
      });
    }
    catch (e) {
      log.error(e);
    }
  }

  $MM.setSettingsStatus("brightnessStatus", `${monitors.size} monitor(s) detected`);
}

function createMonitorAssignment(id: string, name: string, initial: number, volumeCallback: (level: number) => void, throttle: number = 50) {
  let m: monitorInfo = {
    Id: id,
    Name: name,
    Assignment: new Assignment(`Brightness ${name}`, {
      name: name,
      muted: true, // light up the mute button
      volume: initial / 100,
      throttle: throttle,
    }),
    InitialBrightness: initial,
  };

  m.Assignment.on("volumeChanged", (level: number) => {
    volumeCallback(level);
    m.Assignment.volume = level;
  });

  m.Assignment.on("mutePressed", () => {
    // Reset back to initial/default brightness
    m.Assignment.emit("volumeChanged", (m.InitialBrightness / 100))
  });

  monitors.set(m.Name, m);
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

async function refreshWmiMonitorInfo() {
  const cmd = "wmic /NAMESPACE:\\\\root\\WMI PATH wmimonitorbrightness GET currentbrightness,instancename";
  exec(cmd, (err, stdout, stderr) => {
    if (err) {
      console.log(err);
      return;
    }
    if (stderr) {
      console.log(err);
      return;
    }
    parseWMIGet(stdout);
  });
}

async function parseWMIGet(res: string) {
  let lines = res.replace(/\r\n/g, "\n").split("\n");
  if (lines.length < 2) {
    console.log("Not enough lines");
    return null;
  }
  // remove the first result
  lines.shift();

  lines.forEach((val) => {
    let sr = val.split(/\s+/);
    if (sr.length !== 2) {
      console.log("Not valid wmi monitor values");
      return;
    }

    let info = sr[1].match("\#(.+?)\#.+\&(.+?)\#");
    if (info === null) {
      log.info(`${info} was not in the expected format`);
      return;
    }
    let name = `${info[1]} ${info[2]} WMI`;

    let id = sr[1];
    let initial = Number(sr[0]);

    createMonitorAssignment(id, name, initial, (level) => {
      try {
        setWMIBrightness(id, level);
      }
      catch (err) {
        console.log("Error adjusting volume");
        log.error(err);
      }
    })
  });
}

function setWMIBrightness(id: string, level: number) {
  let lev = Math.round(level * 100);

  let escapedId = id.replace(/\\/g, '\\\\')
  const cmd = `wmic /NAMESPACE:\\\\root\\wmi PATH WmiMonitorBrightnessMethods WHERE "Active=TRUE AND InstanceName='${escapedId}'" CALL WmiSetBrightness Brightness=${lev} Timeout=0`

  exec(cmd, (err, stdout, stderr) => {
    if (err) {
      console.log(err);
      throw err;
    }
    if (stderr) {
      console.log(stderr);
      throw stderr;
    }

    // On success no useful output
  });
}

refreshDdcciMonitorInfo();
refreshWmiMonitorInfo();
