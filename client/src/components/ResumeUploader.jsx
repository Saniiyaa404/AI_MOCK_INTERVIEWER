import { useRef, useState } from "react";
import { uploadResume } from "../services/api";

function ResumeUploader({ resume, onResumeExtracted, onRemove, disabled }) {
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a resume first.");
      return;
    }

    try {
      setUploading(true);
      setError("");

      const data = await uploadResume(file);

      onResumeExtracted(data.text, data.resumeId, file.name);
      setFile(null);
    } catch (err) {
      console.error(err);
      setError("Upload failed. Check that the server is running and try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (event) => {
    event.preventDefault();
    const dropped = event.dataTransfer.files?.[0];

    if (dropped && dropped.type === "application/pdf") {
      setFile(dropped);
      setError("");
    } else {
      setError("Only PDF files are supported.");
    }
  };

  // Resume already processed -> show confirmation
  if (resume) {
    return (
      <div>
        <div className="file-row">
          <span className="file-ico" aria-hidden="true">✓</span>
          <div>
            <strong>{resume.fileName || "Resume"}</strong>
            <span>Resume processed successfully</span>
          </div>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={onRemove}
            disabled={disabled}
          >
            Replace
          </button>
        </div>

        <details className="resume-preview">
          <summary>Preview extracted text</summary>
          <pre>{resume.resumeText}</pre>
        </details>
      </div>
    );
  }

  return (
    <div>
      <label
        className="dropzone"
        onDragOver={(event) => event.preventDefault()}
        onDrop={handleDrop}
      >
        <span className="dropzone-ico" aria-hidden="true">⬆</span>
        <strong>{file ? file.name : "Choose a PDF or drag it here"}</strong>
        <small>PDF only. We use it to personalise your questions.</small>
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,application/pdf"
          hidden
          onChange={(event) => {
            setFile(event.target.files[0] || null);
            setError("");
          }}
        />
      </label>

      <button
        type="button"
        className="btn btn-primary btn-lg"
        style={{ marginTop: 16 }}
        onClick={handleUpload}
        disabled={!file || uploading}
      >
        {uploading ? <><span className="spinner" /> Processing resume…</> : "Upload resume"}
      </button>

      {error && <p className="notice notice-error" role="alert">{error}</p>}
    </div>
  );
}

export default ResumeUploader;
