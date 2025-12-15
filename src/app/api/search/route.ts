// Next.js API route
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url!);
  const q = searchParams.get("q");
  if (!q) return new Response(JSON.stringify({ features: [] }), { status: 200 });

  const res = await fetch(`https://photon.bayfield.dev/api?q=${encodeURIComponent(q)}&limit=5`);
  const data = await res.json();

  return new Response(JSON.stringify(data), {
    headers: { "Content-Type": "application/json" },
  });
}
