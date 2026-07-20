import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";

// Static campus catalog — mirrors public campus data used in the app.
const BUILDINGS = [
  { key: "main-block", name: "Main Academic Block", type: "academic", timings: "8:00 AM - 6:00 PM" },
  { key: "cse-block", name: "Computer Science & Engineering Block", type: "academic", timings: "8:00 AM - 8:00 PM" },
  { key: "ece-block", name: "Electronics & Communication Block", type: "academic", timings: "8:00 AM - 6:00 PM" },
  { key: "mech-block", name: "Mechanical Engineering Block", type: "academic", timings: "8:00 AM - 6:00 PM" },
  { key: "kk-block", name: "KK Block (MCA & MBA)", type: "academic", timings: "8:00 AM - 6:00 PM" },
  { key: "admin-block", name: "Admin Block (Main Block)", type: "admin", timings: "8:00 AM - 6:00 PM" },
  { key: "library", name: "Central Library", type: "facility", timings: "8:00 AM - 10:00 PM" },
  { key: "auditorium", name: "Main Auditorium", type: "facility", timings: "Event-based" },
  { key: "ekadants-cafe", name: "Ekadant's Cafe", type: "amenity", timings: "8:00 AM - 6:00 PM" },
  { key: "lickies", name: "Lickies Ice Creams & Cool Drinks", type: "amenity", timings: "10:00 AM - 8:00 PM" },
  { key: "main-canteen", name: "Main Canteen", type: "amenity", timings: "7:00 AM - 9:00 PM" },
  { key: "boys-hostel", name: "Boys Hostel (Block A & B)", type: "hostel", timings: "24/7" },
  { key: "girls-hostel", name: "Girls Hostel", type: "hostel", timings: "24/7" },
  { key: "sports-complex", name: "Sports Complex", type: "sports", timings: "6:00 AM - 8:00 PM" },
  { key: "placement-cell", name: "Training & Placement Cell", type: "admin", timings: "9:00 AM - 5:00 PM" },
];

export default defineTool({
  name: "list_campus_buildings",
  title: "List campus buildings",
  description: "List MITS campus buildings, cafes, hostels, and facilities. Public campus directory data.",
  inputSchema: {
    type: z.enum(["academic", "admin", "facility", "amenity", "hostel", "sports", "all"]).optional()
      .describe("Optional filter by building type; defaults to all."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: ({ type }) => {
    const filtered = !type || type === "all" ? BUILDINGS : BUILDINGS.filter((b) => b.type === type);
    return {
      content: [{ type: "text", text: JSON.stringify(filtered, null, 2) }],
      structuredContent: { buildings: filtered },
    };
  },
});
