# NightOwl

Track and visualize your work hours.

TODO: Add photo here.

## Introduction

Do you actually know how many hours you work every week?

I didn't. So, I created NightOwl. NightOwl records every time you
log in or out, or turn the screensaver on or off.

But it's not enough just to have the data -- you need to be able to
visualize it. That's why NightOwl also includes visualization tools.

For instance, if you run NightOwl for a week and you work a standard
9-5 with an hour for lunch, you may see something like this:

TODO: Add 9-5 photo here.

What does your schedule look like?


Currently, NightOwl only works on Gnome. Please help me bring it to
other OSes and window managers!

## Installation

### Gnome

TODO: Create install script and describe it here.

 1. Create softlink in `~/bin` for `rdm_log.sh`.
 2. Create `~/.config/autostart/tlogger.sh.desktop` with the contents:
    [Desktop Entry]
    Type=Application
    Exec=/home/rdm/env/bin/tlogger.sh    <<< change path to tlogger.sh <<<
    Hidden=false
    X-GNOME-Autostart-enabled=true
    Name[en_US]=watcher
    Name=tlogger
    Comment[en_US]=
    Comment=
 3. To also run in SSH, create `~/.ssh/rc` with the contents:
    /home/rdm/env/bin/tlogger.sh &


### OSX

No support yet for OSX. Feel free to contribute!

### Windows

No support yet for Windows. Feel free to contribute!
