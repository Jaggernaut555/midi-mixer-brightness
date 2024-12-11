# Midi Mixer brightness plugin

Control the brightness of your monitors with Midi Mixer groups.

Monitors not supported by ddc/ci may be able to be controlled by the assignments with `WMI` in the name.

Features:
- An assignment for each monitor
    - The mute button will reset brightness back to what it was when the plugin was loaded
    - The run button will toggle the monitor state on/off
      - Some monitors behave better with this than others
- A button to refresh the list of available monitors
    - Detect any newly plugged in or removed monitors
    - This will reset the mute-button-brightness value

Latest releases of this plugin available [on the project's github page](https://github.com/Jaggernaut555/midi-mixer-brightness/releases/latest)
