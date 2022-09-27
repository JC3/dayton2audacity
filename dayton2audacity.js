#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import rl from 'readline';
import args from 'minimist';

const msg = console.error;

let unknown = false;
const argv = args(process.argv.slice(2), {
    string: 'ref',
    boolean: 'help',
    alias: { help: ['h', '?'], ref: ['r'] },
    unknown: arg => !((arg[0] == '-') && (unknown = true))
});
argv.ref = argv.ref && -parseFloat(argv.ref);

if (unknown || argv.help || argv._.length > 2 || (argv.ref != null && isNaN(argv.ref))) {
    msg();
    msg(`${path.basename(process.argv[0])} ${path.basename(process.argv[1])} [ infile [ outfile ] ] [ -r <dbV> ]`);
    msg();
    msg('   infile    name of dayton audio calibration file (stdin if missing)');
    msg('   outfile   name of audacity filter curve preset (stdout if missing)');
    msg();
    msg('   -r <dbV>  if specified, apply baseline gain from calibration file,');
    msg('             where <dbV> is the *negative* of the design response given');
    msg('             on the product page for your mic. e.g. the emm-6 has a');
    msg('             design sensitivity of -40 dbV @ 1000 hz into 1 kohm so if');
    msg('             you want to correct to that baseline, use "-r 40".');
    process.exit(9);
}

if (argv.ref != null && argv.ref >= 0)
    msg('note: value for -r should be *negative* ref level; are you sure the value is correct?');

const iFilename = argv._[0];
const oFilename = argv._[1];
const refResponse = argv.ref;

process.on('uncaughtException', err => {
    msg(`${err}`); 
    process.exit(1);
});

//-----------------------------------------------------------------------------

msg('reading calibration file...');
const iStream = iFilename ? fs.createReadStream(iFilename) : process.stdin;
const data = {};

rl.createInterface({input:iStream}).on('line', line => {

    data.n = (data.n || 0) + 1;

    line = line.trim().replace(/\s+/g, ' ');
    if (line.length == 0)
        return;

    const parsed = line.match(/^(\*)?([.0-9]+)(Hz)?\s([-.0-9]+)$/) || [];
    const isRef = !!parsed[1];
    const entry = {
        line: data.n,
        freq: parseFloat(parsed[2]),
        gain: parseFloat(parsed[4])
    };
    if (isNaN(entry.freq) || isNaN(entry.gain))
        throw Error(`line ${data.n}: invalid input`);
    
    if (isRef) {
        if (data.ref)
            throw Error(`line ${data.n}: reference level redefined, previous definition at ${data.ref.line}`);
        data.ref = entry;
    } else {
        data.entries ||= {};
        if (data.entries[entry.freq])
            throw Error(`line ${data.n}: duplicate entry for ${entry.freq}hz, previous entry at ${data.entries[entry.freq].line}`);
        data.entries[entry.freq] = entry;
    }
    
}).on('close', () => {
    
    if (Object.keys(data.entries || {}).length == 0)
        throw Error('no valid entries found in input data');

    msg(`read ${Object.keys(data.entries).length} entries`);
    if (data.ref)
        msg(`read reference level ${data.ref.gain}db at ${data.ref.freq}hz`);
    else
        msg(`note: no reference level read from input`);
    
    if (refResponse != null) {
        if (data.ref) {
            const adjust = refResponse - data.ref.gain;
            msg(`design sensitivity given as ${refResponse}db: applying correction of ${adjust}db`);
            Object.values(data.entries).forEach(ent => ent.gain += adjust);
        } else
            throw Error('reference response specified on command line, but no reference level found in input.');
    }

    writeAudacityFilter(oFilename, data).on('close', () => {
        msg('finished.');
    });

});

function writeAudacityFilter (filename, data) {
    
    msg('writing audacity filter...');
    
    const curve = {
        filterLength: 8191,
        InterpolateLin: 0,
        InterpolationMethod: 'B-spline',
        ...Object.fromEntries(Object.values(data.entries)
            .sort((a,b) => a.freq - b.freq)
            // try to reduce point count; audacity has a limit (todo: determine limit and warn)
            .filter((e,n,arr) => (n == 0) || (n == arr.length - 1) || (arr[n].gain != arr[n-1].gain) || (arr[n].gain != arr[n+1].gain))
            .map((e,n) => [[`f${n}`,e.freq], [`v${n}`,e.gain]])
            .flat())
    };
    
    const oStream = filename ? fs.createWriteStream(filename) : process.stdout;
    oStream.write('FilterCurve:');
    oStream.write(Object.entries(curve).map(([k,v]) => `${k}="${v}"`).join(' '));
    oStream.write('\n');
    oStream.end();
    
    return oStream;
    
}
