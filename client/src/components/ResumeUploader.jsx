import { useState } from "react";
import { uploadResume } from "../services/api";

function ResumeUploader({ onResumeExtracted }) {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");
  const [resumeText, setResumeText] = useState("");

  const handleUpload = async () => {
  if (!file) {
    setMessage("Please select a resume first.");
    return;
  }

  try {
    const data = await uploadResume(file);

    setMessage(data.message);
    setResumeText(data.text);

    onResumeExtracted(data.text);
    
  } catch (error) {
    console.error(error);
    setMessage("Upload failed.");
  }
};

  return (
    <div>
      <h2>Upload Resume</h2>

      <input
        type="file"
        accept=".pdf"
        onChange={(event) => {
          setFile(event.target.files[0]);
        }}
      />

      <button onClick={handleUpload}>
        Upload Resume
      </button>

      <p>{message}</p>

      {resumeText && (
        <div>
          <h3>Extracted Resume Text</h3>
          <pre>{resumeText}</pre>
        </div>
      )}
    </div>
  );
}

export default ResumeUploader;