#!/usr/bin/env node

/**
 * Utility script that writes a sample music-profile.json file for the skill.
 * Run it when you want to regenerate the reference JSON from this JS object.
 */

// Node built-ins for filesystem output and path-safe file targeting.
const fs = require("fs");
const path = require("path");

// Source data model that will be serialized to JSON.
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

// Resolve output path relative to this script file for portability.
const outputPath = path.resolve(
  __dirname,
  "..",
  "references",
  "music-profile.json"
);

// Write pretty-printed JSON so humans can read/edit it easily.
fs.writeFileSync(outputPath, JSON.stringify(profile, null, 2));
console.log(`Wrote ${outputPath}`);
