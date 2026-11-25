/**
 * Host half of the Cyrene persona bundle.
 *
 * Registers one host-level system-prompt section so every agent sees the
 * persona. framing.md and card.md are re-read when their mtime changes, so
 * editing either file affects the next model step without a restart.
 */
import { readFileSync, statSync } from "node:fs"

export const name = "cyrene-persona"

export const inject = ["systemPrompt"]

const SECTION = "cyrene:persona"
const ORDER = 5
const FRAMING = new URL("./framing.md", import.meta.url)
const CARD = new URL("./card.md", import.meta.url)

let cached = ""
let stamp = ""

function personaText() {
  try {
    const next = statSync(FRAMING).mtimeMs + ":" + statSync(CARD).mtimeMs
    if (next !== stamp) {
      cached = readFileSync(FRAMING, "utf8").trimEnd() + "\n\n" + readFileSync(CARD, "utf8").trimEnd() + "\n"
      stamp = next
    }
  } catch (error) {
    if (!cached) console.warn("[cyrene-persona] cannot read persona files:", error.message)
  }
  return cached
}

export function apply(ctx) {
  ctx.effect(
    () => ctx.systemPrompt.section({
      name: SECTION,
      order: ORDER,
      text: personaText,
      interpolate: false,
    }),
    "cyrene-persona.section()",
  )
}
