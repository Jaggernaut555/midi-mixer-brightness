# Midi Mixer brightness plugin

Control the brightness of your monitors with Midi Mixer groups.

Monitors MUST support ddc/ci to be controlled by this plugin.

Features:
- An assignment for each monitor
    - The mute button will reset brightness back to what it was when the plugin was loaded
- "Main Control" for modifying brightness of every monitor at once
    - Be aware using this or using Midi Mixer multi-assignment may take a second to change the brightness. This is a limitation of this plugin
    - Possible future feature: Set an offset for each monitor (e.g. monitor [X] will be some % more/less bright than monitor [Y])
- A button to refresh the list of available monitors
    - Detect any newly plugged in or removed monitors
    - This will reset the mute-button-brightness value

Latest releases of this plugin available [on the project's github page](https://github.com/Jaggernaut555/midi-mixer-brightness/releases/latest)
