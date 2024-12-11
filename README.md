# Midi Mixer Brightness Plugin

A plugin to modify the brightness of your monitors with Midi Mixer.

Monitors not supported by ddc/ci may be able to be controlled by the assignments with `WMI` in the name.

### Features
- An assignment for each monitor
    - The mute button will reset brightness back to what it was when the plugin was loaded
    - The run button will toggle the monitor state on/off
      - Some monitors behave better with this than others
- A button to refresh the list of available monitors
    - Detect any newly plugged in or removed monitors
    - This will reset the mute-button-brightness value

## Installing
To install without compiling from source, download the [.midiMixerPlugin from the latest release](https://github.com/Jaggernaut555/midi-mixer-brightness/releases) and double click the file.

This package uses:
- [midi-mixer-plugin](https://github.com/midi-mixer/midi-mixer-plugin)
- [node-ddcci](https://github.com/hensm/node-ddcci)
- [node-powershell](https://github.com/rannn505/child-shell/tree/master/packages/node-powershell#readme)
