import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";

const PLACES: Record<string, { name: string; landmarks: string[]; description: string }> = {
  "ekadants cafe": { name: "Ekadant's Cafe", landmarks: ["Beside KK Block"], description: "Primary cafe for snacks, fast food, and beverages." },
  "lickies": { name: "Lickies Ice Creams & Cool Drinks", landmarks: ["Beside Ekadant's Cafe"], description: "Ice creams, cool drinks, and light refreshments." },
  "main canteen": { name: "Main Canteen", landmarks: ["Opposite side near NPN Block"], description: "Primary canteen for full meals." },
  "library": { name: "Central Library", landmarks: ["Near CSE Block", "Main Entrance Left Side"], description: "Digital + print library, 8am-10pm." },
  "kk block": { name: "KK Block", landmarks: ["Near Ekadant's Cafe", "Near Circular Block"], description: "MCA & MBA department block." },
  "admin block": { name: "Admin Block", landmarks: ["Center of campus", "Adjacent to Lakshmi Block"], description: "Reception, Chairman & VP offices, accounts." },
  "placement cell": { name: "Training & Placement Cell", landmarks: ["Main Block Adjacent", "First Floor"], description: "Career guidance and campus placements." },
  "auditorium": { name: "Main Auditorium", landmarks: ["Behind Main Block", "Near Parking"], description: "1500+ capacity AC auditorium." },
};

export default defineTool({
  name: "find_campus_place",
  title: "Find a campus place",
  description: "Look up a MITS campus place by name and get landmarks and a short description. Fuzzy match on the query.",
  inputSchema: {
    query: z.string().min(1).describe("Place name to search, e.g. 'canteen', 'library', 'KK block'."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: ({ query }) => {
    const q = query.toLowerCase().trim();
    const matches = Object.entries(PLACES).filter(([k, v]) =>
      k.includes(q) || v.name.toLowerCase().includes(q) || q.split(" ").some((w) => w && k.includes(w))
    );
    if (matches.length === 0) {
      return { content: [{ type: "text", text: `No campus place matched "${query}". Try 'library', 'canteen', or a block name.` }] };
    }
    const results = matches.map(([, v]) => v);
    return {
      content: [{ type: "text", text: JSON.stringify(results, null, 2) }],
      structuredContent: { results },
    };
  },
});
