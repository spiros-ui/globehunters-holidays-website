#!/usr/bin/env node
/**
 * GlobeHunters Hero Video Generator
 * Batch generates 50 cinematic hero videos via Runway Gen4.5 text-to-video API.
 * Runs 3 concurrent generations (API limit), polls for completion, downloads MP4s.
 */

import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const API_KEY = process.env.RUNWAY_API_KEY;
const API_BASE = "https://api.dev.runwayml.com/v1";
const HEADERS = {
  Authorization: `Bearer ${API_KEY}`,
  "X-Runway-Version": "2024-11-06",
  "Content-Type": "application/json",
};
const OUTPUT_DIR = path.resolve("public/videos/packages/heroes");
const MAX_CONCURRENT = 3;
const POLL_INTERVAL_MS = 10000; // 10 seconds between polls
const MODEL = "gen4.5";
const DURATION = 10;
const RATIO = "1280:720";

// All 50 video prompts from the brief
const VIDEOS = [
  {
    slug: "dubai",
    prompt: "Cinematic drone shot gliding slowly over the Dubai Marina at golden hour, camera rises to reveal the Burj Khalifa towering above the skyline, yachts in the marina below catching the warm amber light, the city transitioning from day to dusk with lights beginning to twinkle, smooth continuous camera movement, luxury travel film style, 10 seconds, 16:9, no text",
  },
  {
    slug: "santorini",
    prompt: "Cinematic drone sweep along the Santorini caldera at sunset, gliding past the whitewashed villages of Oia with blue domes, the camera slowly descending towards the cliff edge, the Aegean Sea glowing gold and pink below, volcanic islands in the distance, warm Mediterranean light, smooth continuous movement, 10 seconds, 16:9, no text",
  },
  {
    slug: "paris",
    prompt: "Cinematic aerial shot rising above the Seine River at golden hour, the Eiffel Tower emerging into frame as the camera ascends, Pont Alexandre III below with its ornate lampposts, the city of Paris stretching in every direction with Haussmann rooftops catching warm light, soft golden atmosphere, smooth vertical rise, 10 seconds, 16:9, no text",
  },
  {
    slug: "bali",
    prompt: "Cinematic drone shot gliding low over the Tegallalang rice terraces in Bali, morning mist rising from the lush green tiers, camera slowly ascending to reveal the vast jungle canopy and a distant volcano, palm trees swaying gently, golden tropical morning light filtering through, 10 seconds, 16:9, no text",
  },
  {
    slug: "bangkok",
    prompt: "Cinematic aerial shot of Wat Arun temple at sunrise, camera circling slowly around the ornate central prang as the first golden light catches the porcelain mosaic tiles, the Chao Phraya River below with traditional longtail boats, the Bangkok skyline emerging from morning haze in the background, 10 seconds, 16:9, no text",
  },
  {
    slug: "maldives",
    prompt: "Cinematic aerial drone descending towards a Maldivian island resort, starting high above showing the turquoise lagoon gradient from pale aquamarine to deep sapphire, slowly descending to reveal overwater villas with thatched roofs connected by wooden walkways, crystal-clear water showing the reef below, 10 seconds, 16:9, no text",
  },
  {
    slug: "rome",
    prompt: "Cinematic drone shot flying low over Rome's terracotta rooftops at golden hour, weaving between church domes and bell towers, the Colosseum emerging into frame as the camera pushes forward, warm amber light painting ancient stone, pigeons scattering, the Eternal City in all its grandeur, 10 seconds, 16:9, no text",
  },
  {
    slug: "tokyo",
    prompt: "Cinematic time-lapse style shot of the Shibuya Crossing at dusk transitioning to night, hundreds of pedestrians flowing in all directions as the traffic lights change, massive neon advertising screens illuminating the intersection, the organised chaos of the world's busiest crossing, rain-slicked roads reflecting colourful lights, 10 seconds, 16:9, no text",
  },
  {
    slug: "singapore",
    prompt: "Cinematic drone shot approaching Marina Bay Sands at blue hour, camera gliding over the calm bay water showing the hotel's reflection, the Supertree Grove of Gardens by the Bay illuminating in sequence in the background, the ArtScience Museum lotus shape visible, the futuristic skyline of Singapore, 10 seconds, 16:9, no text",
  },
  {
    slug: "barcelona",
    prompt: "Cinematic drone rising from the Gothic Quarter streets to reveal the Sagrada Familia against the Mediterranean Sea, camera ascending through narrow medieval alleyways then breaking free above the rooftops, Gaudi's spires catching the warm afternoon sun, the Barcelona grid and waterfront visible, 10 seconds, 16:9, no text",
  },
  {
    slug: "amsterdam",
    prompt: "Cinematic drone gliding low along an Amsterdam canal at golden hour, gabled canal houses reflected perfectly in the still water, bicycles lining the bridge railings, houseboats with flower pots, autumn trees in warm colours, the camera gently ascending at the end to reveal the concentric canal ring pattern, 10 seconds, 16:9, no text",
  },
  {
    slug: "melbourne",
    prompt: "Cinematic aerial shot of the Great Ocean Road Twelve Apostles at golden hour, camera sweeping laterally along the coastline, the limestone stacks standing in the Southern Ocean with waves crashing and mist swirling, the dramatic ochre cliffs, then the camera rises to show the vast coastline stretching into the distance, 10 seconds, 16:9, no text",
  },
  {
    slug: "bora-bora",
    prompt: "Cinematic aerial drone circling Mount Otemanu in Bora Bora, the dramatic volcanic peak rising from the impossibly turquoise lagoon, overwater bungalows visible on a motu below, the barrier reef creating a gradient of aquamarine blues and greens, fluffy clouds casting shadows on the water, 10 seconds, 16:9, no text",
  },
  {
    slug: "mykonos",
    prompt: "Cinematic drone gliding along the Little Venice waterfront of Mykonos at sunset, colourful houses with wooden balconies hanging over the sea, waves gently splashing the foundations, camera rising to reveal the famous row of windmills on the hill above, the Aegean Sea blazing gold behind, 10 seconds, 16:9, no text",
  },
  {
    slug: "mauritius",
    prompt: "Cinematic aerial drone approaching Le Morne Brabant mountain from the sea, slowly revealing the famous underwater waterfall sand illusion in the turquoise lagoon below, the dramatic mountain rising from the coast, the reef edge visible where aquamarine meets deep blue ocean, 10 seconds, 16:9, no text",
  },
  {
    slug: "prague",
    prompt: "Cinematic drone rising through morning mist over the Vltava River in Prague, Charles Bridge with its baroque statues emerging from the fog, camera ascending to reveal Prague Castle and St Vitus Cathedral glowing in the first golden light, red rooftops of the Old Town stretching below, fairy-tale atmosphere, 10 seconds, 16:9, no text",
  },
  {
    slug: "amalfi-coast",
    prompt: "Cinematic drone sweeping along the Amalfi Coast road, following the cliff edge with Positano's pastel-coloured cascade of houses below, the deep blue Mediterranean catching the afternoon sun, terraced lemon groves on the mountainside, a vintage boat leaving a white wake in the turquoise water far below, 10 seconds, 16:9, no text",
  },
  {
    slug: "tenerife",
    prompt: "Cinematic drone rising from a black sand beach through the cloud layer to reveal Mount Teide's volcanic summit above the sea of clouds at sunset, the dramatic transition from dark coastal landscape to the ethereal cloud layer to the sunlit peak, warm golden and purple tones, 10 seconds, 16:9, no text",
  },
  {
    slug: "tuscany",
    prompt: "Cinematic drone following a cypress-lined road through Val d'Orcia at golden hour, the camera gliding low over the famous winding road, rolling wheat fields in amber tones on either side, a stone farmhouse on a distant hilltop, the patchwork Tuscan landscape stretching to the horizon, 10 seconds, 16:9, no text",
  },
  {
    slug: "rio-de-janeiro",
    prompt: "Cinematic drone ascending alongside Sugarloaf Mountain at sunset, starting from the bay level, rising to match the summit height, revealing the full panorama of Rio de Janeiro — Copacabana beach curve, Christ the Redeemer on Corcovado, Guanabara Bay full of sailboats, the city lights beginning to glow against the fiery sky, 10 seconds, 16:9, no text",
  },
  {
    slug: "swiss-alps",
    prompt: "Cinematic drone gliding towards the Matterhorn at sunrise, crossing over alpine meadows with wildflowers and a mountain lake reflecting the peak, the camera pushing slowly forward as alpenglow paints the iconic pyramid peak in pink and gold, crystal-clear air and perfect alpine atmosphere, 10 seconds, 16:9, no text",
  },
  {
    slug: "new-york",
    prompt: "Cinematic drone shot approaching Manhattan from the East River at blue hour, the Brooklyn Bridge in the foreground with its cables creating leading lines, the illuminated Manhattan skyline reflected in the dark water, the camera rising to clear the bridge towers and reveal the full city grid stretching to the horizon, 10 seconds, 16:9, no text",
  },
  {
    slug: "phuket",
    prompt: "Cinematic drone weaving through the limestone karsts of Phang Nga Bay, camera gliding between towering vertical rock formations emerging from emerald green water, a traditional Thai longtail boat passing below leaving a wake, tropical haze creating depth between the islands, warm afternoon light, 10 seconds, 16:9, no text",
  },
  {
    slug: "cancun",
    prompt: "Cinematic drone flying along Cancun's Hotel Zone barrier island, the turquoise Caribbean Sea on one side and the calm Nichupte Lagoon on the other, white sand beaches stretching endlessly, the vivid contrast of deep blue and pale turquoise water, camera gently ascending to show the full narrow island shape, 10 seconds, 16:9, no text",
  },
  {
    slug: "hawaii",
    prompt: "Cinematic helicopter-style shot flying along the Na Pali Coast in Kauai, the dramatic emerald green fluted cliffs plunging into the deep blue Pacific, waterfalls cascading down the cliff faces, sea mist and tropical light creating rainbow fragments, the most dramatic coastline shot imaginable, 10 seconds, 16:9, no text",
  },
  {
    slug: "marrakech",
    prompt: "Cinematic drone rising from inside the Marrakech Medina at golden hour, starting in a narrow souk alleyway with hanging lanterns casting geometric shadows, ascending through the rooftops to reveal the vast terracotta cityscape, the Koutoubia Mosque minaret prominent, the Atlas Mountains snow-capped in the distant background, 10 seconds, 16:9, no text",
  },
  {
    slug: "lisbon",
    prompt: "Cinematic drone gliding over the terracotta rooftops of Alfama towards the Tagus River at golden hour, the iconic yellow Tram 28 visible climbing a steep street below, Sao Jorge Castle on the hilltop, the camera descending gently towards the river where the 25 de Abril Bridge stretches into the distance, warm Portuguese light, 10 seconds, 16:9, no text",
  },
  {
    slug: "cape-town",
    prompt: "Cinematic drone circling Table Mountain at golden hour, the famous flat summit with its tablecloth of cloud spilling over the edge, the camera orbiting to reveal the city bowl below, Camps Bay beach, the Atlantic Ocean, and the Twelve Apostles mountain range catching warm afternoon light, 10 seconds, 16:9, no text",
  },
  {
    slug: "oman",
    prompt: "Cinematic drone entering the narrow gorge of Wadi Shab in Oman, gliding low over turquoise pools between dramatic canyon walls, date palms and lush vegetation emerging from the arid rock, the camera ascending at the end to reveal the vast Hajar Mountain landscape beyond the wadi, 10 seconds, 16:9, no text",
  },
  {
    slug: "sri-lanka",
    prompt: "Cinematic drone following the famous blue train crossing the Nine Arches Bridge in Ella, the colonial-era viaduct surrounded by emerald tea plantations, mist rising from the hills, the train emerging from the jungle on one side and disappearing into it on the other, the lush Central Highlands of Sri Lanka, 10 seconds, 16:9, no text",
  },
  {
    slug: "vietnam",
    prompt: "Cinematic aerial shot of Ha Long Bay at sunrise, camera gliding between towering limestone karsts emerging from emerald green water, a traditional junk boat with red sails visible below, morning mist creating atmospheric layers between the formations, thousands of karsts stretching to the misty horizon, 10 seconds, 16:9, no text",
  },
  {
    slug: "istanbul",
    prompt: "Cinematic drone approaching the Blue Mosque and Hagia Sophia from across the Bosphorus at sunset, the camera gliding over the water between ferries and cargo ships, the iconic double skyline of domes and minarets growing larger, warm orange light on the historic peninsula, the bridge between two continents, 10 seconds, 16:9, no text",
  },
  {
    slug: "dubrovnik",
    prompt: "Cinematic drone approaching Dubrovnik Old Town from the Adriatic Sea, the medieval city walls growing larger, camera rising to clear the walls and reveal the terracotta rooftops within the oval fortification, the Stradun cutting through the centre, the harbour and Lokrum Island beyond, deep blue Adriatic everywhere, 10 seconds, 16:9, no text",
  },
  {
    slug: "fiji",
    prompt: "Cinematic drone circling a tiny Fijian island resort, thatched-roof bures on white sand, crystal-clear lagoon water showing the coral reef below, the camera completing a slow orbit showing the island from all angles, palm trees bending gently, the vast Pacific Ocean surrounding the paradise in every direction, 10 seconds, 16:9, no text",
  },
  {
    slug: "seychelles",
    prompt: "Cinematic drone descending towards Anse Source d'Argent beach in La Digue, the camera approaching the massive smooth granite boulders on white sand, crystal-clear turquoise water washing between the rocks, palm trees leaning overhead, the most beautiful beach in the world revealed in slow dramatic descent, 10 seconds, 16:9, no text",
  },
  {
    slug: "cairo",
    prompt: "Cinematic drone approaching the Great Pyramids of Giza at golden hour, camera flying low over the desert sand, the three pyramids growing in the frame, ascending to reveal the Sphinx and the Cairo metropolis stretching behind, the ancient and modern worlds colliding, warm desert amber light, 10 seconds, 16:9, no text",
  },
  {
    slug: "costa-rica",
    prompt: "Cinematic drone flying through the Monteverde cloud forest canopy, camera gliding along a suspension bridge with mist drifting through the treetops, exotic birds and butterflies visible, then breaking free above the canopy to reveal Arenal Volcano's perfect cone in the distance with wisps of cloud, 10 seconds, 16:9, no text",
  },
  {
    slug: "kyoto",
    prompt: "Cinematic slow-motion walk through the thousands of vermillion torii gates at Fushimi Inari shrine, the camera at person-height gliding smoothly through the endless tunnel of bright orange-red gates, dappled sunlight creating shifting patterns, the occasional glimpse of the city below through gaps in the gates, 10 seconds, 16:9, no text",
  },
  {
    slug: "jordan",
    prompt: "Cinematic gimbal shot walking through the narrow Siq canyon approaching the Treasury at Petra, the towering sandstone walls in swirling pink and amber patterns, the camera pushing slowly forward as the rose-red facade of Al-Khazneh gradually appears in the narrow opening ahead, warm afternoon light, the moment of reveal, 10 seconds, 16:9, no text",
  },
  {
    slug: "iceland",
    prompt: "Cinematic drone flying along the Jokulsarlon glacier lagoon, camera gliding low over blue and white icebergs floating in the still water, the Vatnajokull glacier wall visible in the background, the camera ascending to reveal Diamond Beach where icebergs wash up on black sand, otherworldly and serene, 10 seconds, 16:9, no text",
  },
  {
    slug: "buenos-aires",
    prompt: "Cinematic drone ascending from the colourful houses of La Boca at golden hour, starting at street level with the painted corrugated metal buildings in vivid yellows, blues, and reds, rising to reveal the Riachuelo river, the port, and the Buenos Aires skyline stretching into the amber distance, tango music atmosphere, 10 seconds, 16:9, no text",
  },
  {
    slug: "london",
    prompt: "Cinematic drone gliding along the Thames at blue hour, Tower Bridge opening ahead as a tall ship passes through, the camera ascending to clear the bridge and reveal the full London skyline — the Shard, St Paul's Cathedral, the Gherkin — all illuminated against a deep blue twilight sky, 10 seconds, 16:9, no text",
  },
  {
    slug: "zanzibar",
    prompt: "Cinematic drone approaching a pristine Zanzibar beach from the Indian Ocean at sunset, a traditional dhow with white sail gliding across the turquoise water in the foreground, the white sand beach and palm trees growing closer, the camera ascending gently to reveal the coastline and the silhouette of Stone Town in the distance, 10 seconds, 16:9, no text",
  },
  {
    slug: "kenya-safari",
    prompt: "Cinematic aerial drone sweeping low over the Masai Mara savannah at golden hour, a herd of elephants walking in formation below, their shadows long on the golden grass, acacia trees dotting the landscape, the camera rising to reveal Mount Kilimanjaro's snow-capped peak on the distant horizon, the vast African wilderness, 10 seconds, 16:9, no text",
  },
  {
    slug: "abu-dhabi",
    prompt: "Cinematic drone approaching the Sheikh Zayed Grand Mosque at blue hour, gliding over the reflecting pools towards the white marble domes, the mosque's 82 domes and gold-accented minarets illuminated against the deep blue sky, the camera rising to show the full symmetrical grandeur of the compound, 10 seconds, 16:9, no text",
  },
  {
    slug: "antigua",
    prompt: "Cinematic drone flying along an Antiguan coastline, turquoise Caribbean water meeting white sand beaches, the camera following the scalloped bays and rocky headlands, palm trees lining the shore, a luxury catamaran sailing below, ascending at the end to show the full island surrounded by the Caribbean Sea, 10 seconds, 16:9, no text",
  },
  {
    slug: "maldives-honeymoon",
    prompt: "Cinematic drone descending at sunset towards a private overwater villa in the Maldives, the sky a watercolour of coral and lavender, the camera approaching the villa's private deck where lanterns are lit, the turquoise lagoon turning gold in the sunset light, intimate and romantic atmosphere, the most beautiful sunset in the world, 10 seconds, 16:9, no text",
  },
  {
    slug: "thailand-islands",
    prompt: "Cinematic drone weaving through the islands of Ang Thong Marine Park near Koh Samui, dozens of limestone islands rising from emerald green water, dense jungle covering each island, the camera gliding between formations showing hidden lagoons and white beaches, a speedboat leaving a trail below, 10 seconds, 16:9, no text",
  },
  {
    slug: "greek-islands",
    prompt: "Cinematic drone following a Greek ferry crossing the Aegean Sea towards a Cycladic island at golden hour, the white ferry creating a wake on deep blue water, the island growing closer with its whitewashed village visible on the hillside, other islands dotted on the horizon, the romance of Greek island hopping, 10 seconds, 16:9, no text",
  },
  {
    slug: "morocco",
    prompt: "Cinematic drone flying through the blue-painted streets of Chefchaouen, rising from the narrow stepped alleyways washed in shades of cobalt and indigo, ascending above the blue Medina to reveal the Rif Mountains behind, the camera pulling back to show the entire blue city nestled in the mountain valley, 10 seconds, 16:9, no text",
  },
];

// --- Helpers ---

async function apiRequest(method, endpoint, body) {
  const opts = { method, headers: HEADERS };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${API_BASE}${endpoint}`, opts);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${res.status}: ${text}`);
  }
  return res.json();
}

async function submitVideo(slug, prompt) {
  const data = await apiRequest("POST", "/text_to_video", {
    model: MODEL,
    promptText: prompt,
    ratio: RATIO,
    duration: DURATION,
  });
  return data.id;
}

async function pollTask(taskId) {
  while (true) {
    const task = await apiRequest("GET", `/tasks/${taskId}`);
    if (task.status === "SUCCEEDED") return task;
    if (task.status === "FAILED") throw new Error(`Task ${taskId} FAILED: ${JSON.stringify(task)}`);
    if (task.status === "THROTTLED") {
      console.log(`  ⏳ Task ${taskId} throttled, waiting 30s...`);
      await sleep(30000);
      continue;
    }
    // PENDING or RUNNING
    await sleep(POLL_INTERVAL_MS);
  }
}

async function downloadVideo(url, outputPath) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download failed: ${res.status}`);
  const buffer = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(outputPath, buffer);
}

function compressVideo(inputPath, outputPath) {
  // Compress to CRF 25 (target under 5MB), strip audio
  try {
    execSync(
      `ffmpeg -y -i "${inputPath}" -c:v libx264 -crf 25 -preset medium -an -movflags +faststart "${outputPath}"`,
      { stdio: "pipe" }
    );
    return true;
  } catch {
    return false;
  }
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function fileSize(p) {
  try {
    return fs.statSync(p).size;
  } catch {
    return 0;
  }
}

function formatBytes(bytes) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / 1048576).toFixed(1) + " MB";
}

// --- Progress tracking ---
const PROGRESS_FILE = path.join(OUTPUT_DIR, ".progress.json");

function loadProgress() {
  try {
    return JSON.parse(fs.readFileSync(PROGRESS_FILE, "utf-8"));
  } catch {
    return {};
  }
}

function saveProgress(progress) {
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));
}

// --- Main ---

async function processVideo(video, progress) {
  const { slug, prompt } = video;
  const finalPath = path.join(OUTPUT_DIR, `${slug}-hero-video.mp4`);
  const rawPath = path.join(OUTPUT_DIR, `${slug}-hero-video-raw.mp4`);

  // Skip if already completed
  if (progress[slug]?.status === "done" && fs.existsSync(finalPath)) {
    console.log(`✅ ${slug} — already done (${formatBytes(fileSize(finalPath))})`);
    return;
  }

  try {
    // Submit
    console.log(`🎬 ${slug} — submitting to Runway Gen4.5...`);
    const taskId = await submitVideo(slug, prompt);
    progress[slug] = { status: "submitted", taskId };
    saveProgress(progress);
    console.log(`   Task ID: ${taskId}`);

    // Poll
    console.log(`   Polling for completion...`);
    const task = await pollTask(taskId);
    const videoUrl = task.output?.[0] || task.artifacts?.[0]?.url || task.artifacts?.[0]?.download;
    if (!videoUrl) throw new Error(`No output URL in task: ${JSON.stringify(task)}`);

    // Download raw
    console.log(`   Downloading...`);
    await downloadVideo(videoUrl, rawPath);
    const rawSize = fileSize(rawPath);
    console.log(`   Raw: ${formatBytes(rawSize)}`);

    // Compress if over 5MB or if ffmpeg is available
    if (rawSize > 5 * 1024 * 1024) {
      console.log(`   Compressing (over 5MB)...`);
      if (compressVideo(rawPath, finalPath)) {
        fs.unlinkSync(rawPath);
        console.log(`   Compressed: ${formatBytes(fileSize(finalPath))}`);
      } else {
        fs.renameSync(rawPath, finalPath);
        console.log(`   ffmpeg unavailable, using raw`);
      }
    } else {
      // Still compress for faststart flag (better streaming)
      if (compressVideo(rawPath, finalPath)) {
        fs.unlinkSync(rawPath);
        console.log(`   Optimised: ${formatBytes(fileSize(finalPath))}`);
      } else {
        fs.renameSync(rawPath, finalPath);
      }
    }

    progress[slug] = { status: "done", taskId, size: fileSize(finalPath) };
    saveProgress(progress);
    console.log(`✅ ${slug} — complete!\n`);
  } catch (err) {
    progress[slug] = { status: "failed", error: err.message };
    saveProgress(progress);
    console.error(`❌ ${slug} — failed: ${err.message}\n`);
    // Clean up raw file
    try { fs.unlinkSync(rawPath); } catch {}
  }
}

async function main() {
  if (!API_KEY) {
    console.error("Error: RUNWAY_API_KEY environment variable not set");
    process.exit(1);
  }

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const progress = loadProgress();
  const remaining = VIDEOS.filter(
    (v) => progress[v.slug]?.status !== "done" || !fs.existsSync(path.join(OUTPUT_DIR, `${v.slug}-hero-video.mp4`))
  );

  console.log(`\n🎥 GlobeHunters Hero Video Generator`);
  console.log(`   Model: ${MODEL} | Duration: ${DURATION}s | Ratio: ${RATIO}`);
  console.log(`   Total: ${VIDEOS.length} | Remaining: ${remaining.length} | Concurrent: ${MAX_CONCURRENT}\n`);

  // Process in batches of MAX_CONCURRENT
  for (let i = 0; i < remaining.length; i += MAX_CONCURRENT) {
    const batch = remaining.slice(i, i + MAX_CONCURRENT);
    console.log(`--- Batch ${Math.floor(i / MAX_CONCURRENT) + 1} (${batch.map((v) => v.slug).join(", ")}) ---\n`);
    await Promise.all(batch.map((v) => processVideo(v, progress)));
    // Small delay between batches to be kind to the API
    if (i + MAX_CONCURRENT < remaining.length) {
      console.log(`   Waiting 5s before next batch...\n`);
      await sleep(5000);
    }
  }

  // Summary
  const done = VIDEOS.filter((v) => progress[v.slug]?.status === "done").length;
  const failed = VIDEOS.filter((v) => progress[v.slug]?.status === "failed").length;
  console.log(`\n🏁 Complete: ${done}/${VIDEOS.length} succeeded, ${failed} failed`);
  if (failed > 0) {
    console.log(`   Failed: ${VIDEOS.filter((v) => progress[v.slug]?.status === "failed").map((v) => v.slug).join(", ")}`);
    console.log(`   Run again to retry failed videos.`);
  }
}

main().catch(console.error);
