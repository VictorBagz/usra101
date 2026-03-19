
if (typeof window !== "undefined" && !window.supabase) {
  console.warn("Supabase not yet initialized. Waiting for createClient.js...");
} else {
  console.log("Supabase config loaded:", window.supabase);
}
