// One-off: seed Memory Lane Comics' portal from the hardcoded content in the
// memory-lane-comics repo.
//
// Usage: node --env-file=.env.local scripts/migrate-mlc.mjs [--dry-run]
//
// Safe to re-run: crew rows are matched on (client_id, slug) and updated in
// place, and a member's picks are replaced rather than duplicated.
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const MLC = "da08188d-b6de-4864-a5c5-7587101c64a8";
const DRY = process.argv.includes("--dry-run");

const MLC_REPO =
  process.env.HOME +
  "/Library/Mobile Documents/com~apple~CloudDocs/Desktop/Claude/GitHub/memory-lane-comics";

const url = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceRoleKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

const supabase = createClient(url, serviceRoleKey, { auth: { persistSession: false } });

// Guard: the service-role key bypasses RLS, so refuse to run unless the target
// client really is Memory Lane. Nothing here may touch another client's rows.
const { data: client } = await supabase
  .from("clients")
  .select("id, domain")
  .eq("id", MLC)
  .maybeSingle();

if (!client || client.domain !== "mlcshop.com") {
  console.error("Refusing to run: client id does not resolve to mlcshop.com.");
  process.exit(1);
}

const crew = [
  {
    slug: "jake", name: "Jake", title: "Co-Owner",
    bio: "Part time Reed Richards impersonator and Proud co-owner of MLC; Enjoys games and sports, music, reading comics, SELLING comics",
    picks_url: "/jakespics", photo: "jake.jpg", image_position: "center", shop_location: "original",
    picks: [
      "https://static.wixstatic.com/media/eca6af_35f7cb4193e54c4ca1faedc7e3851a79~mv2.jpg",
      "https://static.wixstatic.com/media/eca6af_72c0f5dc8571478c8eb1d0c284d5ca78~mv2.jpg",
    ],
  },
  {
    slug: "ben", name: "Ben", title: "Co-Owner",
    bio: "Ben is a lover and a fighter, which comes first you ask? I don't know. Ask him. Co-Owns with his obviously cooler & smarter older brother",
    picks_url: "/benspicks", photo: "ben.jpg", image_position: "center", shop_location: "original",
    picks: [
      "https://static.wixstatic.com/media/eca6af_77f5eaf2d615486d8e9a1c8325952b09~mv2.jpg",
      "https://static.wixstatic.com/media/eca6af_3e68edf7ef2045b4995f1da22a38e7d5~mv2.jpg",
    ],
  },
  {
    slug: "eric", name: "Eric", title: "Part II Manager",
    bio: "Running the show at Part II — ask Eric anything about the store and he'll have the answer. Probably.",
    picks_url: null, photo: "eric.jpg", image_position: "top", shop_location: "part_two",
    picks: [],
  },
  {
    slug: "ace", name: "Ace", title: "Crew Member",
    bio: "The tenacious ace is ready to hit you with hit recommendation after hit recommendation",
    picks_url: "/acespicks", photo: "ace.jpg", image_position: "top", shop_location: "original",
    picks: [
      "https://static.wixstatic.com/media/eca6af_9cc0bde72aa240e3bd9b53211abca254~mv2.jpg",
      "https://static.wixstatic.com/media/eca6af_45049b53fad348b3a3d96c03adc880cf~mv2.jpg",
    ],
  },
  {
    slug: "jose", name: "Jose", title: "Part II Crew",
    bio: "Jose's positivity will make you believe that a guy like superman can actually exist. You. Will. Believe.",
    // The files in the memory-lane-comics repo are mislabelled: sean.jpg is Jose
    // and jose.jpg is Sean. Swapped here rather than in the repo, so the static
    // site keeps working until it reads from Supabase.
    picks_url: "/petapicks", photo: "sean.jpg", image_position: "center", shop_location: "part_two",
    picks: [],
  },
  {
    slug: "sean", name: "Sean", title: "Part II Crew",
    bio: "Sean is the keeper of things that are rad...he'll make your shelf cooler...Mastered being a good dude. Mastered it, we say!",
    picks_url: null, photo: "jose.jpg", image_position: "top", shop_location: "part_two",
    picks: [],
  },
];

async function uploadBytes(bucket, path, bytes, contentType) {
  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, bytes, { contentType, upsert: true });
  if (error) throw new Error(`upload ${path}: ${error.message}`);
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}

let crewCount = 0;
let pickCount = 0;

for (const [i, m] of crew.entries()) {
  const localPhoto = `${MLC_REPO}/public/crew/${m.photo}`;
  const bytes = readFileSync(localPhoto);

  if (DRY) {
    console.log(`[dry] ${m.name}: photo ${bytes.length}b, ${m.picks.length} picks`);
    continue;
  }

  const photoUrl = await uploadBytes(
    "team-media",
    `${MLC}/${m.slug}/${m.slug}.jpg`,
    bytes,
    "image/jpeg"
  );

  const fields = {
    client_id: MLC,
    slug: m.slug,
    name: m.name,
    title: m.title,
    bio: [m.bio], // crew variant stores one paragraph as a single-element array
    picks_url: m.picks_url,
    shop_location: m.shop_location,
    image_position: m.image_position,
    sort_order: i,
    photo: photoUrl,
  };

  const { data: existing } = await supabase
    .from("team_members")
    .select("id")
    .eq("client_id", MLC)
    .eq("slug", m.slug)
    .maybeSingle();

  let memberId;
  if (existing) {
    const { error } = await supabase.from("team_members").update(fields).eq("id", existing.id);
    if (error) throw new Error(`update ${m.slug}: ${error.message}`);
    memberId = existing.id;
  } else {
    const { data, error } = await supabase
      .from("team_members")
      .insert(fields)
      .select("id")
      .single();
    if (error) throw new Error(`insert ${m.slug}: ${error.message}`);
    memberId = data.id;
  }

  crewCount++;
  console.log(`crew: ${m.name} (${m.slug}) -> ${memberId}`);

  // Replace this member's picks so re-running doesn't duplicate them.
  await supabase.from("team_picks").delete().eq("client_id", MLC).eq("team_member_id", memberId);

  for (const [j, remoteUrl] of m.picks.entries()) {
    const res = await fetch(remoteUrl);
    if (!res.ok) throw new Error(`fetch ${remoteUrl}: ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());

    const image = await uploadBytes(
      "team-media",
      `${MLC}/picks/${m.slug}/pick-${j + 1}.jpg`,
      buf,
      "image/jpeg"
    );

    const { error } = await supabase.from("team_picks").insert({
      team_member_id: memberId,
      client_id: MLC,
      image,
      // The old site had no real comic titles — only generic alt text. The crew
      // should rename these in the portal.
      title: `${m.name}'s pick ${j + 1}`,
      sort_order: j,
    });
    if (error) throw new Error(`pick ${m.slug} ${j}: ${error.message}`);

    pickCount++;
    console.log(`  pick ${j + 1}: ${buf.length}b`);
  }
}

// The weekly video the homepage currently hardcodes.
if (!DRY) {
  const { error } = await supabase.from("client_settings").upsert(
    { client_id: MLC, key: "weekly_video_url", value: "https://www.instagram.com/reel/Dayp8HMRjAw/" },
    { onConflict: "client_id,key" }
  );
  if (error) throw new Error(`weekly_video_url: ${error.message}`);
  console.log("setting: weekly_video_url");
}

console.log(`\nDone. ${crewCount} crew, ${pickCount} picks.`);
