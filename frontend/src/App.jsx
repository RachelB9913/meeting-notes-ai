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
    </div>
  );
}

export default App;
