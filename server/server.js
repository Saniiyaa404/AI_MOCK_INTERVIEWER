const express = require("express");
const cors = require("cors");

const app = express();

const PORT = 5000;

app.use(cors());

const testRoutes = require("./routes/testRoutes");
const resumeRoutes = require("./routes/resumeRoutes");
const interviewRoutes = require("./routes/interviewRoutes");

app.use(express.json());

app.use("/api", testRoutes);
app.use("/api/resume", resumeRoutes);
app.use("/api/interview", interviewRoutes);

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});