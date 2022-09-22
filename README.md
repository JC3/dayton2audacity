# dayton2audacity

convert [dayton audio mic calibration files](http://support.daytonaudio.com/MicrophoneCalibrationTool) to [audacity filter curve eq](https://manual.audacityteam.org/man/filter_curve_eq.html) presets

# installation

you'll need node.js (tested on v16) of course. then run `npm install` to install the dependencies.

i haven't made a proper deployment package so it's pretty much download source, grab dependencies, and run with node.

# usage

```
node dayton2audacity.js [ infile [ outfile ] ] [ -r <ref> ]

   infile    name of dayton audio calibration file (stdin if missing)
   outfile   name of audacity filter curve preset (stdout if missing)

   -r <dbV>  if specified, apply baseline gain from calibration file,
             where <dbV> is the *negative* of the design response given
             on the product page for your mic. e.g. the emm-6 has a
             design sensitivity of -40 dbV @ 1000 hz into 1 kohm so if
             you want to correct to that baseline, use "-r 40".
```

1. download calibration file for your dayton audio mic from http://support.daytonaudio.com/MicrophoneCalibrationTool

2. run this program to create an audacity filter curve eq preset text file

3. in audacity: *effect → filter curve → manage → import*, then load the file

![filter curve eq](screenshot.png?raw=true "filter curve eq")

# notes

## reference level

on the product pages for dayton's mics, a design sensitivity dbV level is given that maps response voltage at
some frequency and input impedence to absolute sound pressure. in the calibration file, the actual response at
this frequency and input impedence is given. the `-r` option can be used if you want to use the value in the 
file to apply a global baseline correction factor to bring the observed sensitivity in line with the design
sensitivity.

however, as useful as this sounds, in many cases it isn't necessary: in particular, if you're recording audio
with these mics and adjusting your input gains on the fly, e.g. you've got a tone generator that you're
calibrating gains with or you're eyeballing it, then you don't actually want this correction factor, since you're
basically applying your own. it's only really useful if you're reading actual voltages from the mic as-is.

## audacity limitations

audacity silently places a limit on the number of points in the filter curve but this program won't warn if the limit is exceeded. so if your filter curve in audacity has a suspicious lack of points on the high frequency end, that's probably what happened. however, this program tries to minimize the number of points by removing consecutive frequency entries with the same gain values, and it usually seems to be ok.

## windows + bash + pipes

if you happen to be running this in bash on windows and piping the output to something else, and you get an error `stdout is not a tty`, run it with "node.exe" instead of just "node".

this is weirdness that i can't explain, but it applies to all applications run from bash on windows ([see this](https://stackoverflow.com/a/62532536)). 
