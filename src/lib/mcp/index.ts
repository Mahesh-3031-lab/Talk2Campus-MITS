import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listBuildingsTool from "./tools/list-buildings";
import findPlaceTool from "./tools/find-place";
import listVendorsTool from "./tools/list-vendors";
import listMenuTool from "./tools/list-menu";

// Vite inlines VITE_* env vars at build time — keeps the entry import-safe.
const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "talk2campus-mcp",
  title: "Talk2Campus",
  version: "0.1.0",
  instructions:
    "Tools for Talk2Campus (Madanapalle Institute of Technology and Science). " +
    "Use `list_campus_buildings` and `find_campus_place` to look up MITS locations, " +
    "and `list_canteen_vendors` + `list_menu_items` to browse campus food outlets.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [listBuildingsTool, findPlaceTool, listVendorsTool, listMenuTool],
});
