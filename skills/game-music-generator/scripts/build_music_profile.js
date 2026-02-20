#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const profile = {
  normal: {
    bpm: 92,
    steps: [220, 277.18, 329.63, 277.18, 246.94, 293.66, 349.23, 293.66],
  },
  boat: {
    bpm: 132,
    steps: [329.63, 392.0, 440.0, 392.0, 349.23, 415.3, 493.88, 415.3],
  },
  sfx: {
    sale: [880.0, 1174.66, 1567.98],
  },
};

const outputPath = path.resolve(
  __dirname,
  "..",
  "references",
  "music-profile.json"
);

fs.writeFileSync(outputPath, JSON.stringify(profile, null, 2));
console.log(`Wrote ${outputPath}`);
