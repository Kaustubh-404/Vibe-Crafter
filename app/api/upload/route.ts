import { type NextRequest, NextResponse } from "next/server"

const PINATA_JWT =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiJjZGQ4Zjg4OC02MzhjLTRkMTUtOWE2ZC00MzVhOTIwZmEwYzYiLCJlbWFpbCI6ImthdXN0dWJocGFyZGVzaGk2OUBnbWFpbC5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwicGluX3BvbGljeSI6eyJyZWdpb25zIjpbeyJkZXNpcmVkUmVwbGljYXRpb25Db3VudCI6MSwiaWQiOiJGUkExIn0seyJkZXNpcmVkUmVwbGljYXRpb25Db3VudCI6MSwiaWQiOiJOWUMxIn1dLCJ2ZXJzaW9uIjoxfSwibWZhX2VuYWJsZWQiOmZhbHNlLCJzdGF0dXMiOiJBQ1RJVkUifSwiYXV0aGVudGljYXRpb25UeXBlIjoic2NvcGVkS2V5Iiwic2NvcGVkS2V5S2V5IjoiNzg4OTc1NWQxNWYwMzk0Yjk0ZGYiLCJzY29wZWRLZXlTZWNyZXQiOiIyMzcyMzA2NmE5ODg3MGFmZjZkMmVmZjAzYzMyOTgyYjA0ZGVjZDYxZjMzZjNhOGFmMGU5Y2ZjMzk2ZGJkYjY2IiwiZXhwIjoxNzgzNTA2MTg0fQ.ENjWhaxavyYHTg0fVy3N0QzTaW7EF7MtFC0lHynQqi0"
const PINATA_API_URL = "https://api.pinata.cloud"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large. Maximum size is 10MB." }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "video/mp4",
      "video/webm",
      "video/quicktime",
    ]

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: "Unsupported file type" }, { status: 400 })
    }

    console.log(`Uploading file: ${file.name} (${file.size} bytes, ${file.type})`)

    // Upload to Pinata IPFS
    const pinataFormData = new FormData()
    pinataFormData.append("file", file)

    const metadata = JSON.stringify({
      name: `DeaVibeCrafter_${file.name}`,
      keyvalues: {
        app: "dea-vibe-crafter",
        type: "submission",
        uploadedAt: new Date().toISOString(),
        fileType: file.type,
        fileSize: file.size.toString(),
      },
    })
    pinataFormData.append("pinataMetadata", metadata)

    const response = await fetch(`${PINATA_API_URL}/pinning/pinFileToIPFS`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PINATA_JWT}`,
      },
      body: pinataFormData,
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Pinata API error: ${response.status} - ${errorText}`)
      throw new Error(`Pinata API error: ${response.status}`)
    }

    const result = await response.json()
    console.log("Upload successful:", result)

    return NextResponse.json({
      success: true,
      ipfsHash: result.IpfsHash,
      url: `https://gateway.pinata.cloud/ipfs/${result.IpfsHash}`,
      size: file.size,
      type: file.type,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json(
      {
        error: "Upload failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
