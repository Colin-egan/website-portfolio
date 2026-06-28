"use client";

import { motion } from "framer-motion";

const blobs = [
  "M47.5,-65.3C60.2,-55.8,68.4,-40.4,72.1,-24.2C75.7,-8,74.9,8.9,68.5,23.3C62.2,37.7,50.2,49.7,36.3,57.5C22.4,65.3,6.5,68.9,-10.6,69.4C-27.7,69.9,-46,67.3,-57.3,57.3C-68.6,47.3,-72.9,29.8,-72.9,12.8C-72.8,-4.2,-68.3,-20.7,-59.2,-33.3C-50.1,-45.9,-36.3,-54.7,-22.3,-63.3C-8.3,-71.9,6,-80.3,21.4,-79.4C36.8,-78.5,53.2,-68.2,47.5,-65.3Z",
  "M52.3,-63.1C66.7,-52.5,77,-36.4,79.7,-19.4C82.5,-2.4,77.7,15.5,68.9,30.6C60.1,45.7,47.3,58,32.6,65.3C17.9,72.6,1.3,74.9,-16.1,72.4C-33.5,69.9,-51.7,62.5,-63.1,49.6C-74.5,36.7,-79.2,18.3,-77.2,1.2C-75.2,-15.9,-66.5,-31.8,-55.1,-43.2C-43.7,-54.6,-29.7,-61.5,-15,-66.2C-0.3,-70.9,15.1,-73.5,29.8,-72.8C44.5,-72.1,58.5,-68,52.3,-63.1Z",
  "M43.6,-55.1C56.1,-44.3,65.9,-30.1,69.8,-14.1C73.8,1.9,71.9,19.7,64.1,34.1C56.3,48.5,42.6,59.5,27.1,66.1C11.6,72.7,-5.7,74.9,-22.4,70.7C-39.1,66.5,-55.2,55.8,-63.2,41.2C-71.2,26.6,-71.1,8,-66.4,-8.5C-61.7,-25,-52.4,-39.4,-40.2,-50.3C-28,-61.1,-12.9,-68.4,1.9,-70.7C16.8,-73,34.8,-70.3,43.6,-55.1Z",
];

export function BlobMorph() {
  return (
    <div className="h-full flex flex-col items-center justify-center gap-3">
      <div className="text-xs font-medium text-purple-400 uppercase tracking-widest">SVG Blob Morph</div>
      <div className="relative w-40 h-40 flex items-center justify-center">
        <motion.svg
          viewBox="-100 -100 200 200"
          className="w-full h-full"
        >
          <defs>
            <clipPath id="blobClip">
              <motion.path
                animate={{ d: blobs }}
                transition={{
                  duration: 8,
                  repeat: Infinity,
                  repeatType: "loop",
                  ease: "easeInOut",
                }}
              />
            </clipPath>
          </defs>
          <image
            href="/CH.jpeg"
            x="-100"
            y="-100"
            width="200"
            height="200"
            preserveAspectRatio="xMidYMid slice"
            clipPath="url(#blobClip)"
          />
        </motion.svg>
      </div>
      <p className="text-xs text-muted-foreground">Continuous path interpolation</p>
    </div>
  );
}
