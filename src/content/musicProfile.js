export const bgmSetDurationMs = 120000;
export const bgmTempoMultiplier = 1.2;

export const musicProfile = {
  sets: [
    {
      vibe: "Happy, Jovial",
      normal: { bpm: 108, steps: [261.63, 329.63, 392, 440, 392, 329.63, 349.23, 392], leadType: "triangle", bassType: "sine", leadVolume: 0.05 },
      boat: { bpm: 124, steps: [329.63, 392, 440, 493.88, 440, 392, 369.99, 392], leadType: "square", bassType: "triangle", leadVolume: 0.055 },
    },
    {
      vibe: "Moody, Blues",
      normal: { bpm: 76, steps: [196, 233.08, 261.63, 293.66, 261.63, 233.08, 220, 196], leadType: "sawtooth", bassType: "sine", leadVolume: 0.048 },
      boat: { bpm: 88, steps: [220, 261.63, 293.66, 329.63, 293.66, 261.63, 246.94, 220], leadType: "square", bassType: "triangle", leadVolume: 0.052 },
    },
    {
      vibe: "R&B, Romantic",
      normal: { bpm: 82, steps: [220, 277.18, 311.13, 369.99, 329.63, 311.13, 277.18, 246.94], leadType: "triangle", bassType: "sine", leadVolume: 0.046 },
      boat: { bpm: 96, steps: [246.94, 311.13, 349.23, 392, 349.23, 311.13, 293.66, 261.63], leadType: "square", bassType: "triangle", leadVolume: 0.05 },
    },
    {
      vibe: "Vibes, Lofi",
      normal: { bpm: 72, steps: [174.61, 220, 261.63, 220, 196, 233.08, 261.63, 233.08], leadType: "triangle", bassType: "sine", leadVolume: 0.042 },
      boat: { bpm: 84, steps: [196, 246.94, 293.66, 246.94, 220, 261.63, 311.13, 261.63], leadType: "square", bassType: "triangle", leadVolume: 0.047 },
    },
    {
      vibe: "Hip-hop, Groovy",
      normal: { bpm: 98, steps: [185, 220, 261.63, 293.66, 261.63, 220, 196, 220], leadType: "square", bassType: "sine", leadVolume: 0.053 },
      boat: { bpm: 112, steps: [207.65, 246.94, 293.66, 329.63, 293.66, 246.94, 220, 246.94], leadType: "square", bassType: "triangle", leadVolume: 0.058 },
    },
    {
      vibe: "Scary, Spooky",
      normal: { bpm: 66, steps: [146.83, 174.61, 196, 233.08, 174.61, 196, 164.81, 146.83], leadType: "sawtooth", bassType: "sine", leadVolume: 0.044 },
      boat: { bpm: 80, steps: [164.81, 196, 220, 261.63, 196, 220, 185, 164.81], leadType: "square", bassType: "triangle", leadVolume: 0.049 },
    },
  ],
  sfx: {
    sale: [880, 1174.66, 1567.98],
  },
};
