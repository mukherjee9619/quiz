// src/utils/formatQuestion.js
export function formatQuestion(rawText, explanation = "", answer = "") {
  /* ================= SAFETY ================= */
  if (!rawText || typeof rawText !== "string") {
    return {
      questionPart: "⚠ Question data is missing or invalid.",
      codePart: "",
      language: "text",
      isInvalid: true,
      explanation,
      answer,
    };
  }

  const originalText = rawText.trim();

  /* ================= LANGUAGE DETECTION ================= */
  const detectors = [
    { lang: "cpp", regex: /#include\s*<|using\s+namespace\s+std|cout\s*<<|cin\s*>>/ },
    { lang: "c", regex: /#include\s*<|printf\s*\(|scanf\s*\(/ },
    { lang: "java", regex: /class\s+\w+|public\s+static\s+void\s+main|System\.out\./ },
    { lang: "python", regex: /def\s+\w+\(|print\s*\(|for\s+\w+\s+in\s+|if\s+__name__\s*==/ },
  ];

  let language = "text";
  for (const d of detectors) {
    if (d.regex.test(originalText)) {
      language = d.lang;
      break;
    }
  }

  /* ================= SPLIT QUESTION & CODE ================= */
  let questionPart = "";
  let codePart = "";

  const lines = originalText.split("\n");

  // Program-based question
  if (language !== "text") {
    questionPart = lines[0].trim();
    codePart = lines.slice(1).join("\n").trim();
  }
  // Expression / output-based
  else if (lines.length > 1) {
    questionPart = lines[0].trim();
    codePart = lines.slice(1).join("\n").trim();
    language = "clike"; // Prism-safe expression highlight
  }
  // Plain question
  else {
    questionPart = originalText;
    codePart = "";
  }

  /* ================= FINAL VALIDATION ================= */
  const isInvalid =
    questionPart.length < 5 ||
    (questionPart.toLowerCase().includes("output") && codePart.length === 0);

  return {
    questionPart: isInvalid
      ? "⚠ This question is incomplete due to missing code or expression."
      : questionPart,
    codePart,
    language,
    isInvalid,
    explanation,
    answer,
  };
}
