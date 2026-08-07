import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const SPEECHMATICS_API_KEY = Deno.env.get("SPEECHMATICS_API_KEY");
const SPEECHMATICS_BASE = "https://asr.api.speechmatics.com/v2";

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }

  if (!SPEECHMATICS_API_KEY) {
    console.error("SPEECHMATICS_API_KEY not configured");
    return new Response(JSON.stringify({ error: "Server configuration error" }), {
      status: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }

  try {
    const body = await req.json();

    // ── MODE A: Submit a new transcription job ──
    if (body.audio && body.mime_type) {
      return await handleSubmit(body.audio, body.mime_type);
    }

    // ── MODE B: Poll / fetch result for an existing job ──
    if (body.jobId) {
      return await handlePoll(body.jobId);
    }

    return new Response(JSON.stringify({ error: "Provide either {audio, mime_type} to submit or {jobId} to poll" }), {
      status: 400,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }
});

/* ── Submit audio → return jobId immediately ── */
async function handleSubmit(audioBase64: string, mime_type: string) {
  // Decode base64 audio to binary
  const binaryString = atob(audioBase64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  const formData = new FormData();
  const audioBlob = new Blob([bytes], { type: mime_type });
  const ext = mime_type.includes("wav") ? "wav" : mime_type.includes("webm") ? "webm" : "mp4";
  formData.append("data_file", audioBlob, "recording." + ext);

  const config = {
    type: "transcription",
    transcription_config: { language: "en" },
  };
  formData.append("config", JSON.stringify(config));

  console.log("Submitting transcription job to Speechmatics...");
  const createRes = await fetch(`${SPEECHMATICS_BASE}/jobs/`, {
    method: "POST",
    headers: { Authorization: `Bearer ${SPEECHMATICS_API_KEY}` },
    body: formData,
  });

  if (!createRes.ok) {
    const errText = await createRes.text();
    console.error("Speechmatics job creation failed:", createRes.status, errText);
    return new Response(
      JSON.stringify({ error: `Speechmatics API error: ${createRes.status} — ${errText.slice(0, 200)}` }),
      { status: 502, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } },
    );
  }

  const jobData = await createRes.json();
  console.log("Speechmatics job created:", jobData.id);

  return new Response(JSON.stringify({ jobId: jobData.id }), {
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
  });
}

/* ── Poll job status / fetch transcript ── */
async function handlePoll(jobId: string) {
  const statusRes = await fetch(`${SPEECHMATICS_BASE}/jobs/${jobId}/`, {
    headers: { Authorization: `Bearer ${SPEECHMATICS_API_KEY}` },
  });

  if (!statusRes.ok) {
    const errText = await statusRes.text();
    console.error("Speechmatics status check failed:", statusRes.status, errText);
    return new Response(
      JSON.stringify({ error: `Status check failed: ${statusRes.status}` }),
      { status: 502, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } },
    );
  }

  const statusData = await statusRes.json();
  const jobStatus = statusData.job?.status;
  console.log(`Job ${jobId} status:`, jobStatus);

  // If done, fetch the transcript
  if (jobStatus === "done") {
    const transcriptRes = await fetch(
      `${SPEECHMATICS_BASE}/jobs/${jobId}/transcript?format=txt`,
      { headers: { Authorization: `Bearer ${SPEECHMATICS_API_KEY}` } },
    );

    if (!transcriptRes.ok) {
      const errText = await transcriptRes.text();
      console.error("Failed to fetch transcript:", transcriptRes.status, errText);
      return new Response(JSON.stringify({ error: "Failed to fetch transcript" }), {
        status: 502,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }

    const transcript = await transcriptRes.text();
    console.log("Transcript received, length:", transcript.length);

    return new Response(
      JSON.stringify({ status: "done", transcript: transcript.trim() }),
      { headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } },
    );
  }

  // Still processing, rejected, or expired
  if (jobStatus === "rejected" || jobStatus === "expired" || jobStatus === "deleted") {
    return new Response(
      JSON.stringify({ status: jobStatus, error: `Transcription job was ${jobStatus}` }),
      { status: 422, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } },
    );
  }

  // Still running
  return new Response(
    JSON.stringify({ status: "running" }),
    { headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } },
  );
}