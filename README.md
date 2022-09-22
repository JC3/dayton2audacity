# dayton2audacity

convert [dayton audio mic calibration files](http://support.daytonaudio.com/MicrophoneCalibrationTool) to [audacity filter curve eq](https://manual.audacityteam.org/man/filter_curve_eq.html) presets

# installation

you'll need node.js (tested on v16) of course. there aren't any dependencies, and i haven't made a proper deployment package so it's pretty much download source and run.

# usage

```
node dayton2audacity.js [ infile [ outfile ] ]

   infile    name of dayton audio calibration file (stdin if missing)
   outfile   name of audacity filter curve preset (stdout if missing)
```

1. download calibration file for your dayton audio mic from http://support.daytonaudio.com/MicrophoneCalibrationTool

2. run this program to create an audacity filter curve eq preset text file

3. in audacity: *effect → filter curve → manage → import*, then load the file

![filter curve eq](screenshot.png?raw=true "filter curve eq")

# notes

- there is a baseline reference level at the beginning of the dayton files that is read but (currently) ignored.

- audacity silently places a limit on the number of points in the filter curve but this program won't warn if the limit is exceeded. so if your filter curve in audacity has a suspicious lack of points on the high frequency end, that's probably what happened. however, this program tries to minimize the number of points by removing consecutive frequency entries with the same gain values, and it usually seems to be ok.
