const express = require("express");
const multer = require("multer");
const fs = require("fs"); // file system
const { PDFParse } = require("pdf-parse");

const router = express.Router();

const upload = multer({
    dest: "uploads/"
});

router.post("/upload", upload.single("resume"), async (req, res) => {
    try {
        const filePath = req.file.path;

        const pdfBuffer = fs.readFileSync(filePath);

        const parser = new PDFParse({ data: pdfBuffer });

        const pdfData = await parser.getText();

        await parser.destroy();

        fs.unlinkSync(filePath);

        res.json({
            message: "Resume processed successfully!",
            text: pdfData.text
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to process resume."
        });
    }
});

module.exports = router;