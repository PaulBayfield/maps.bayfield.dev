import { NextResponse } from "next/server";
import Database from "better-sqlite3";
import { authOptions } from "../auth/[...nextauth]/route";
import { getServerSession } from "next-auth";


const db = new Database("markers.db");


type Marker = {
  lat: number;
  lon: number;
  description: string;
  type: string;
};



db.prepare(`
  CREATE TABLE IF NOT EXISTS markers (
    lat REAL,
    lon REAL,
    description TEXT,
    type TEXT
  )
`).run();

export async function GET() {
  const session = await getServerSession(authOptions);

  let markers = db
    .prepare("SELECT * FROM markers")
    .all() as Marker[];

  if (!session) {
    markers = markers.filter(
      m => !["maison", "gite", "restaurant", "famille"].includes(m.type)
    );
  }

  return NextResponse.json(markers);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  } else {
    const userEmail = session.user?.email;
    if (userEmail !== process.env.NEXT_PUBLIC_APP_ADMIN_EMAIL) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }
  }

  const body = await req.json();

  const validTypes = [
    "tout",
    "monument",
    "maison",
    "musee",
    "zoo",
    "parc",
    "ville",
    "aeroport",
    "gite",
    "restaurant",
    "famille"
  ];
  if (!validTypes.includes(body.type)) {
    return NextResponse.json(
      { error: "Invalid type" },
      { status: 400 }
    );
  }

  const stmt = db.prepare(
    "INSERT INTO markers (lat, lon, description, type) VALUES (?, ?, ?, ?)"
  );
  stmt.run(body.lat, body.lon, body.description, body.type);

  return NextResponse.json({ success: true });
}
