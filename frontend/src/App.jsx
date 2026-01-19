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

  function getButtonStyle(key, extra = {}) {
    const isActive = activeButton === key;
    return {
      ...buttonBaseStyle,
      border: isActive ? "2.5px solid #360cee" : buttonBaseStyle.border,
      ...extra,
    };
  }

  function bindPressEvents(key) {
    return {
      onMouseDown: () => setActiveButton(key),
      onMouseUp: () => setActiveButton(null),
      onMouseLeave: () => setActiveButton(null),
    };
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
          <div style={{ fontSize: 14, color: "#099414" }}>
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
          {...bindPressEvents("process")}
          style={getButtonStyle("process", {
            padding: "0.6rem 1rem",
            cursor: !file || loading ? "not-allowed" : "pointer",
            opacity: !file || loading ? 0.6 : 1,
          })}
        >
          {loading ? "Processing..." : "Process"}
        </button>

        {!file ? (
          <p style={{ marginTop: "0.75rem", color: "#f13434" }}>
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
            <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.5rem" }}>
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
  );
}

export default App;
