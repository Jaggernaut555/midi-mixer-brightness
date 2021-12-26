import { Assignment, ButtonType } from "midi-mixer-plugin";
// @hensm/ddcci
const ddcci = require("@hensm/ddcci");

interface monitorInfo {
  Id: string;
  Name: string;
  InitialBrightness: number;
  Assignment: Assignment;
}

let monitors = new Map<string, monitorInfo>()
let mainControl: monitorInfo;
let refreshButton: ButtonType = new ButtonType("Refresh Monitors", {
  name: "Refresh Monitor List",
  active: true,
});

refreshButton.on("pressed", () => {
  ddcci._refresh();
  refreshMonitorInfo();
  $MM.showNotification("Refreshed Brightness plugin monitor list");
})

async function refreshMonitorInfo() {
  monitors.clear();

  for (const rawmon of ddcci.getMonitorList()) {
    try {
      let mon: string = rawmon
  
      let info = mon.match("\#(.+?)\#.+\&(.+?)\#");
      if (info === null) {
        continue;
      }
  
      let name = `${info[1]} ${info[2]}`;
      let brightness = ddcci.getBrightness(mon);

      let m: monitorInfo = {
        Id: mon,
        Name: name,
        Assignment: new Assignment(`Brightness ${name}`, {
          name: name,
          muted: true, // light up the mute button
          volume: brightness / 100,
        }),
        InitialBrightness: brightness,
      };
  
      m.Assignment.on("volumeChanged", (level:number) => {
        let lev = Math.round(level*100);
        ddcci.setBrightness(m.Id, lev);
        m.Assignment.volume = level;
      })

      m.Assignment.on("mutePressed", () => {
        // Reset back to initial/default brightness
        m.Assignment.emit("volumeChanged", (m.InitialBrightness / 100))
      })
  
      monitors.set(m.Name, m);
    }
    catch (e) {
      log.error(e);
    }
  }
  
  $MM.setSettingsStatus("brightnessStatus", `${monitors.size} monitor(s) detected`);
  

  createMainControl()
}

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
  for(const m of monitors) {
    sum += m[1].Assignment.volume * 100
  }
  let avg = sum / monitors.size;

  mainControl = {
    Id: "Main control",
    Name: "Main Control",
    Assignment: new Assignment("Main Control", {
      name: "Main Control",
      muted: true,
      volume: avg / 100,
    }),
    InitialBrightness: avg,
  };

  mainControl.Assignment.on("volumeChanged", (level:number) => {
    mainControl.Assignment.volume = level;
    monitors.forEach((v,k) => {
      v.Assignment.emit("volumeChanged", level);
    });
  })

  mainControl.Assignment.on("mutePressed", () => {
    mainControl.Assignment.volume = mainControl.InitialBrightness;
    monitors.forEach((v,k) => {
      v.Assignment.emit("mutePressed");
    })
  })
}


refreshMonitorInfo();

