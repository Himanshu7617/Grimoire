import { supabase } from "@/lib/database";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../generated/prisma/client";
import { NextResponse } from "next/server";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

export async function POST(req: Request) {
  const formData = await req.formData();

  const files = formData.getAll("files") as File[];
  const urls = formData.getAll("urls") as string[];

  if (!files.length && !urls.length) {
    return NextResponse.json(
      { error: "No files or URLs provided." },
      { status: 400 }
    );
  }

  const createdSources = [];

  // Handle URLs
  for (const url of urls) {
    const source = await prisma.source.create({
      data: {
        type: "url",
        url,
        name: url,
      },
    });

    createdSources.push(source);
  }

  // Handle Files
  for (const file of files) {
    const filePath = `${Date.now()}-${file.name}`;

    const { error } = await supabase.storage
      .from("uploads")
      .upload(filePath, file);

    if (error) {
      return NextResponse.json(
        { error: "File upload failed", details: error.message },
        { status: 500 }
      );
    }

    const source = await prisma.source.create({
      data: {
        type: "file",
        name: file.name,
        url: filePath,
      },
    });

    createdSources.push(source);
  }

  // ONE return at the end
  return NextResponse.json(
    { success: true, sources: createdSources },
    { status: 201 }
  );
}
