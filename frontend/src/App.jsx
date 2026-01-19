import { useMemo, useState } from "react";

function getApiBaseUrl() {
  const base = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";
  return base.replace(/\/$/, "");
}

function parseFilenameFromContentDisposition(headerValue) {
  if (!headerValue) return null;

  // Examples:
  // attachment; filename="summary.docx"
  // attachment; filename=summary.docx
  const match = headerValue.match(/filename\*?=(?:UTF-8''|")?([^\";]+)\"?/i);
  if (!match) return null;

  try {
    return decodeURIComponent(match[1]);
  } catch {
    return match[1];
  }
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename || "summary.docx";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

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
  const [activeButton, setActiveButton] = useState(null);
  const [exportLoading, setExportLoading] = useState(false);
  const [hoverButton, setHoverButton] = useState(null);

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

  function clearFile() { // clear selected file and reset state
    setFile(null);
    setResultJson(null);
    setError("");
    setExportLoading(false);

    const input = document.getElementById("audio-file-input");
    if (input) input.value = "";
  }

  async function onProcessClick() {
    if (!file) return;

    setLoading(true);
    setError("");
    setResultJson(null);

    try {
      const baseUrl = getApiBaseUrl();
      const url = new URL(`${baseUrl}/process`);
      url.searchParams.set("llm_provider", llmProvider);
      url.searchParams.set("output", outputFormat);

      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(url.toString(), {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        // try to get error message from response body
        let bodyText = "";
        try {
          bodyText = await res.text();
        } catch {
          bodyText = "";
        }
        const msg = bodyText ? `HTTP ${res.status}: ${bodyText}` : `HTTP ${res.status}: Request failed`;
        throw new Error(msg);
      }

      if (outputFormat === "json") {
        const data = await res.json();
        setResultJson(data);
        return;
      }

      // outputFormat === "docx"
      const blob = await res.blob();
      const cd = res.headers.get("content-disposition");
      const filename = parseFilenameFromContentDisposition(cd) || "meeting-summary.docx";
      downloadBlob(blob, filename);

      setResultJson({
        status: "ok",
        message: "DOCX downloaded successfully.",
        selected: { llm_provider: llmProvider, output: outputFormat },
      });
    } catch (e) {
      const message = e && e.message ? e.message : "Something went wrong. Please try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  async function onExportDocx() {
    if (!resultJson) return;

    setExportLoading(true);
    setError("");

    try {
      const baseUrl = getApiBaseUrl();
      const url = new URL(`${baseUrl}/export/docx`);

      // optional query params supported by backend
      if (file && file.name) url.searchParams.set("original_filename", file.name);
      if (llmProvider) url.searchParams.set("llm_provider", llmProvider);

      const summaryOnly = resultJson?.summary ?? resultJson;

      const res = await fetch(url.toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(summaryOnly),
      });

      if (!res.ok) {
        let bodyText = "";
        try {
          bodyText = await res.text();
        } catch {
          bodyText = "";
        }
        const msg = bodyText ? `HTTP ${res.status}: ${bodyText}` : `HTTP ${res.status}: export failed`;
        throw new Error(msg);
      }

      const blob = await res.blob();
      const cd = res.headers.get("content-disposition");
      const filename = parseFilenameFromContentDisposition(cd) || "meeting-notes.docx";
      downloadBlob(blob, filename);
    } catch (e) {
      const message = e && e.message ? e.message : "Export failed. Please try again.";
      setError(message);
    } finally {
      setExportLoading(false);
    }
  }

  const buttonBaseStyle = {
    padding: "0.45rem 0.75rem",
    borderRadius: 10,
    border: "1px solid #ccc",
    outline: "none",
    cursor: "pointer",
    background: "white",
  };

  const cardStyle = {
    border: "1px solid #e6e8ef",
    borderRadius: 16,
    padding: "1.1rem",
    background: "white",
    boxShadow: "0 10px 28px rgba(15, 23, 42, 0.06)",
  };

  function getButtonStyle(key, extra = {}) {
    const isActive = activeButton === key;
    const isHover = hoverButton === key;

    return {
      ...buttonBaseStyle,
      border: isActive ? "2.5px solid #360cee" : "1px solid #cccccc",
      background: isHover ? "#dee8ff" : buttonBaseStyle.background,
      transition: "all 0.15s ease",
      ...extra,
    };
  }

  function bindPressEvents(key) {
    return {
      onMouseDown: () => setActiveButton(key),
      onMouseUp: () => setActiveButton(null),
      onMouseLeave: () => {
        setActiveButton(null);
        setHoverButton(null);
      },
      onMouseEnter: () => setHoverButton(key),
    };
  }

  return (
  <div
    style={{
      minHeight: "100vh",
      background: "#f6f7fb",
      padding: "2.5rem 1rem",
      fontFamily: "Inter, system-ui, Arial",
    }}
  >
    <div style={{ maxWidth: 720, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: "1.25rem" }}>
        <h1 style={{ margin: 0, fontSize: 34, color: "#0c2663" }}>
          Meeting Transcription & Summarization
        </h1>
        <p style={{ margin: "0.35rem 0 0", color: "#555", fontSize: 16 }}>
          End-to-end AI system for audio transcription and structured meeting summaries
        </p>
      </div>

      {/* Card 1: Upload */}
      <div style={cardStyle}>
        <h2 style={{ margin: 0, fontSize: 16, color: "#111" }}>1) Upload audio</h2>
        <div style={{ height: 12 }} />

        <input
          id="audio-file-input"
          type="file"
          accept=".mp3,.wav,.m4a,audio/mpeg,audio/wav,audio/mp4"
          onChange={onFileChange}
          style={{ marginTop: 6 }}
        />

        {fileMeta ? (
          <div style={{ marginTop: "0.75rem" }}>
            <div><strong>Selected:</strong> {fileMeta.name}</div>
            <div><strong>Size:</strong> {fileMeta.size}</div>
            <div><strong>Type:</strong> {fileMeta.type}</div>

            <button
              type="button"
              onClick={clearFile}
              {...bindPressEvents("clear")}
              style={getButtonStyle("clear", { marginTop: "0.75rem" })}
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

      {/* Card 2: Options */}
      <div style={{ ...cardStyle, marginTop: "1rem" }}>
        <h2 style={{ margin: 0, fontSize: 16, color: "#111" }}>2) Options</h2>
        <div style={{ height: 12 }} />

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
          <div style={{ fontSize: 14, color: "#076304" }}>
            <strong>Current selection:</strong>{" "}
            llm_provider=<code>{llmProvider}</code>, output=<code>{outputFormat}</code>
          </div>
        </div>
      </div>

      {/* Card 3: Run */}
      <div style={{ ...cardStyle, marginTop: "1rem" }}>
        <h2 style={{ margin: 0, fontSize: 16, color: "#111" }}>3) Run</h2>
        <div style={{ height: 12 }} />

        <button
          type="button"
          onClick={onProcessClick}
          disabled={!file || loading}
          {...bindPressEvents("process")}
          style={getButtonStyle("process", {
            padding: "0.6rem 1.1rem",
            background: !file || loading
              ? "#f1f5f9"
              : hoverButton === "process"
                ? "#1e293b"
                : "#0f172a",
            color: !file || loading ? "#999" : "white",
            border: "none",
            cursor: !file || loading ? "not-allowed" : "pointer",
            opacity: !file || loading ? 0.6 : 1,
          })}
        >
          {loading ? "Processing..." : "Process"}
          {loading ? (
            <div style={{ marginTop: "0.75rem", color: "#555", fontSize: 14 }}>
              This can take a short while depending on audio length.<br />
              Please be patient.
            </div>
          ) : null}
        </button>

        {!file ? (
          <p style={{ marginTop: "0.75rem", color: "#b00020" }}>
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

            <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.5rem", flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={() => navigator.clipboard.writeText(JSON.stringify(resultJson, null, 2))}
                {...bindPressEvents("copy")}
                style={getButtonStyle("copy")}
              >
                Copy JSON
              </button>

              <button
                type="button"
                onClick={onExportDocx}
                disabled={exportLoading}
                {...bindPressEvents("export")}
                style={getButtonStyle("export", {
                  cursor: exportLoading ? "not-allowed" : "pointer",
                  opacity: exportLoading ? 0.6 : 1,
                })}
              >
                {exportLoading ? "Preparing Word..." : "Download Word (.docx)"}
              </button>
            </div>

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
  </div>
);
}

export default App;