import { fetchVideoMetadata } from "./youtube.ts";

async function main() {
  const result = await fetchVideoMetadata('ZbO9PBdFRdc')
  console.log(result)
}

main();
