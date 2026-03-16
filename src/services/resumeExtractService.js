const fs = require("fs/promises");
const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");

async function extractTextFromFile(filePath, mimeType) {
  const buffer = await fs.readFile(filePath);

  if (mimeType === "application/pdf") {
    const data = await pdfParse(buffer);
    return (data.text || "").trim();
  }

  if (
    mimeType ===
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    const result = await mammoth.extractRawText({ buffer });
    return (result.value || "").trim();
  }

  throw new Error("Unsupported file type for text extraction");
}

module.exports = { extractTextFromFile };