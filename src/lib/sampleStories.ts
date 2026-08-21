export interface SampleStory {
  id: string;
  title: string;
  genre: string;
  style_id: string;
  description: string;
  markdown: string;
}

export const SAMPLE_STORIES: SampleStory[] = [
  {
    id: 'cyberpunk-neon-heist',
    title: 'Neon Protocol: The Ghost Chip',
    genre: 'Cyberpunk Action',
    style_id: 'cyberpunk-neon',
    description: 'A rogue hacker and a cyber-enhanced mercenary breach a mega-corporation sky tower.',
    markdown: `---
title: "Neon Protocol: The Ghost Chip"
author: "Kira Thorne"
genre: "Cyberpunk Action"
art_style: "Cyberpunk Neon Noir"
palette: "cyan, magenta, deep obsidian"
panels_per_page: 4
---

# Scene 1: The Rooftop Infiltration

Rain lashed against the obsidian glass of Arasaka Tower. High above Neo-Shinjuku's neon canyons, Kira adjusted her holographic visor.

> "Security sub-routines are cycling every ninety seconds," Kira whispered through the neural comms. "Jax, are you in position?"

On the adjacent communications spire, Jax racked the slide of his magnetic coil-rifle. His mechanical arm gleamed beneath the flickering holographic billboard.

> "Locked and loaded, Kid," Jax replied with a grim smirk. "Give me the signal before their spider-drones sniff us out."

Kira slammed the data-spike into the rooftop junction box. Electrical arcs danced across her fingers as the grid flickered green.

<!-- panel-break -->

# Scene 2: The Quantum Core Breach

The blast doors hissed open, revealing the subterranean quantum server chamber. A suspended crystalline sphere hummed with unearthly blue plasma.

> "There it is... the Ghost Core," Kira breathed, stepping onto the catwalk.

Suddenly, crimson alert sirens bathed the room in blood-red warning light. From the ceiling vents, four quad-legged combat androids dropped into attack stance, heavy cannons whirring to life.

> "Ambush!" Jax roared, throwing himself in front of Kira as plasma bolts scorched the reinforced titanium floor. "Grab the drive and get to the extraction vent! I'll hold the line!"
`
  },
  {
    id: 'fantasy-relic-quest',
    title: 'The Sunken Temple of Eldoria',
    genre: 'High Fantasy',
    style_id: 'watercolor-fantasy',
    description: 'An elven mage and an armored knight discover a legendary glowing crystal deep within forgotten ruins.',
    markdown: `---
title: "The Sunken Temple of Eldoria"
author: "Master Elowen"
genre: "High Fantasy"
art_style: "Watercolor Fantasy"
palette: "emerald green, gold, misty azure"
panels_per_page: 4
---

# Scene 1: The Hidden Waterfall Gate

Beneath the roaring cascades of the Whisper Falls, Sir Gareth parted the ancient vines to reveal the moss-covered stone archway of Eldoria.

> "The runes are still humming after three thousand winters," Gareth murmured, resting a gauntleted hand on his broadsword.

Lady Lyra stepped forward, her wooden staff illuminating the dark cavern with swirling starlight.

> "Beware the threshold, Knight," Lyra warned. "The ancients did not leave their secrets unguarded."

As they crossed the stone threshold, giant stone gargoyles overhead turned their luminous topaz eyes toward the intruders.

<!-- panel-break -->

# Scene 2: The Heart of Starlight

In the central rotunda, floating upon an altar of solid obsidian, hovered the Sunfire Shard, pulsing with warm golden radiance.

> "By the heavens... it's real," Gareth gasped, lowering his visor in awe.

Lyra reached out with her enchanted staff, tracing a circle of protection in the air as the ancient guardian colossus began to rise from the floor.

> "Keep your shield high, Gareth! The guardian awakens!"
`
  },
  {
    id: 'ai-tech-explainer',
    title: 'How Neural Networks Think: A Comic Guide',
    genre: 'Sci-Fi Education',
    style_id: 'western-heroic',
    description: 'A fun visual exploration into how weights, biases, and token prediction create AI intelligence.',
    markdown: `---
title: "How Neural Networks Think: A Comic Guide"
author: "Dr. Ada Matrix"
genre: "Sci-Fi Education"
art_style: "Modern Western Comic"
palette: "electric blue, amber, white"
panels_per_page: 4
---

# Scene 1: Entering the Digital Brain

Imagine traveling inside a vast digital metropolis where billions of glowing pathways connect like constellations in deep space.

> "Welcome to Layer 1: The Input Space!" Professor Ada exclaimed, flying in her anti-gravity capsule. "Every word and pixel gets converted into numerical vectors!"

Her robotic assistant, Byte-9, spun excitedly while projecting glowing matrix equations in mid-air.

> "BEEP! Dimensionality reduction initialized! 1,536 dimensions mapped to semantic clusters!"

Ahead of them, giant glowing tensor gates began calculating dot products at the speed of light.

<!-- panel-break -->

# Scene 2: The Attention Mechanism

They approached the grand central nexus: The Multi-Head Attention Chamber, where glowing energy threads linked every word to its context.

> "Look closely," Ada pointed. "The query and key vectors are calculating relevance scores across the entire prompt!"

A massive holographic stream of probabilities illuminated: the next token was predicted with 99.4% confidence!

> "And that is how reasoning emerges from simple arithmetic!" Byte-9 cheered.
`
  }
];
