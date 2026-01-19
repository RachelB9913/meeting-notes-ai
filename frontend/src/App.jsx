import { useMemo, useState } from "react";

function formatBytes(bytes) {
  if (!bytes && bytes !== 0) return "";
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let i = 0;
  while (value >= 1024 && i < units.length - 1) {
    value = value / 1024;
    i += 1;
  }
  return `${value.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

function App() {
  const [file, setFile] = useState(null);
  const [llmProvider, setLlmProvider] = useState("openai");
  const [outputFormat, setOutputFormat] = useState("json");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resultJson, setResultJson] = useState(null);

  const fileMeta = useMemo(() => {
    if (!file) return null;
    return {
      name: file.name,
      size: formatBytes(file.size),
      type: file.type || "unknown",
    };
  }, [file]);

  function onFileChange(e) {
    const picked = e.target.files && e.target.files[0] ? e.target.files[0] : null;
    setFile(picked);
  }

  function clearFile() {
    setFile(null);
    // reset the input value so selecting the same file again triggers onChange
    const input = document.getElementById("audio-file-input");
    if (input) input.value = "";
  }

  async function onProcessClick() {
    if (!file) return;

    setLoading(true);
    setError("");
    setResultJson(null);

    try {
      // TEMP: simulate a short request so we can test loading + result UI
      await new Promise((resolve) => setTimeout(resolve, 600));

      if (outputFormat === "json") {
        setResultJson({
          status: "ok",
          message: "UI is ready. Next step will call the backend /process endpoint.",
          selected: { llm_provider: llmProvider, output: outputFormat },
          file: { name: file.name, sizeBytes: file.size, type: file.type || "unknown" },
        });
      } else {
        // For docx, we'll implement real download in the next step (API integration)
        setResultJson({
          status: "ok",
          message: "DOCX selected. Next step will trigger a file download from backend.",
          selected: { llm_provider: llmProvider, output: outputFormat },
        });
      }
    } catch (e) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 860, margin: "0 auto", padding: "2rem", fontFamily: "Arial" }}>
      <h1 style={{ marginTop: 0 }}>Meeting Transcription & Summarization</h1>

      <div style={{ border: "1px solid #ddd", borderRadius: 12, padding: "1rem" }}>
        <h2 style={{ marginTop: 0, fontSize: 18 }}>1) Upload audio</h2>

        <input
          id="audio-file-input"
          type="file"
          accept=".mp3,.wav,.m4a,audio/mpeg,audio/wav,audio/mp4"
          onChange={onFileChange}
        />

        {fileMeta ? (
          <div style={{ marginTop: "0.75rem" }}>
            <div><strong>Selected:</strong> {fileMeta.name}</div>
            <div><strong>Size:</strong> {fileMeta.size}</div>
            <div><strong>Type:</strong> {fileMeta.type}</div>

            <button
              type="button"
              onClick={clearFile}
              style={{ marginTop: "0.75rem", padding: "0.4rem 0.75rem", cursor: "pointer" }}
            >
              Clear
            </button>
          </div>
        ) : (
          <p style={{ marginTop: "0.75rem", color: "#666" }}>
            Choose an audio file (mp3 / wav / m4a).
          </p>
        )}
      </div>

      <div style={{ marginTop: "1rem", border: "1px solid #ddd", borderRadius: 12, padding: "1rem" }}>
        <h2 style={{ marginTop: 0, fontSize: 18 }}>2) Options</h2>

        <div style={{ display: "grid", gap: "0.75rem", gridTemplateColumns: "1fr 1fr" }}>
          <label style={{ display: "grid", gap: "0.35rem" }}>
            <span style={{ fontWeight: 600 }}>LLM Provider</span>
            <select
              value={llmProvider}
              onChange={(e) => setLlmProvider(e.target.value)}
              style={{ padding: "0.45rem", borderRadius: 8, border: "1px solid #ccc" }}
            >
              <option value="openai">OpenAI</option>
              <option value="claude">Claude (Anthropic)</option>
            </select>
          </label>

          <div style={{ display: "grid", gap: "0.35rem" }}>
            <span style={{ fontWeight: 600 }}>Output format</span>

            <label style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <input
                type="radio"
                name="output"
                value="json"
                checked={outputFormat === "json"}
                onChange={(e) => setOutputFormat(e.target.value)}
              />
              JSON (show on screen)
            </label>

            <label style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <input
                type="radio"
                name="output"
                value="docx"
                checked={outputFormat === "docx"}
                onChange={(e) => setOutputFormat(e.target.value)}
              />
              Word (.docx) download
            </label>
          </div>
        </div>

        <div style={{ marginTop: "0.75rem", padding: "0.75rem", background: "#fafafa", borderRadius: 10 }}>
          <div style={{ fontSize: 13, color: "#444" }}>
            <strong>Current selection:</strong>{" "}
            llm_provider=<code>{llmProvider}</code>, output=<code>{outputFormat}</code>
          </div>
        </div>
      </div>
    
      <div style={{ marginTop: "1rem", border: "1px solid #ddd", borderRadius: 12, padding: "1rem" }}>
        <h2 style={{ marginTop: 0, fontSize: 18 }}>3) Run</h2>

        <button
          type="button"
          onClick={onProcessClick}
          disabled={!file || loading}
          style={{
            padding: "0.6rem 1rem",
            borderRadius: 10,
            border: "1px solid #ccc",
            cursor: !file || loading ? "not-allowed" : "pointer",
            opacity: !file || loading ? 0.6 : 1,
          }}
        >
          {loading ? "Processing..." : "Process"}
        </button>

        {!file ? (
          <p style={{ marginTop: "0.75rem", color: "#666" }}>
            Please upload an audio file first.
          </p>
        ) : null}

        {error ? (
          <div style={{ marginTop: "0.75rem", padding: "0.75rem", background: "#fff5f5", borderRadius: 10 }}>
            <strong style={{ color: "#b00020" }}>Error:</strong> {error}
          </div>
        ) : null}

        {resultJson ? (
          <div style={{ marginTop: "0.75rem" }}>
            <h3 style={{ marginBottom: "0.5rem", fontSize: 16 }}>Result</h3>
            <pre
              style={{
                margin: 0,
                padding: "0.75rem",
                background: "#0b1020",
                color: "white",
                borderRadius: 10,
                overflowX: "auto",
                fontSize: 12,
              }}
            >
  {JSON.stringify(resultJson, null, 2)}
              </pre>
            </div>
          ) : null}
        </div>
    </div>
  );
}

export default App;
