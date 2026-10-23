// Shared by DocumentLibrary and AddDocumentDialog.
export const MAX_MB = 50;
export const mb = (n) => `${(n / 1048576).toFixed(1)} MB`;

// Same keys as profiles.school_curricula and the source_documents check constraint.
export const CURRICULA = {
  cambridge: "Cambridge",
  igcse: "IGCSE",
  cbc: "CBC",
  844: "8-4-4",
  ib: "IB",
  american: "American",
};

export const DOC_TYPES = {
  exam_paper: { label: "Exam paper", icon: "📝", tag: "Exam" },
  mark_scheme: { label: "Mark scheme", icon: "✅", tag: "Marking" },
  syllabus: { label: "Syllabus", icon: "📘", tag: "Syllabus" },
  curriculum_map: { label: "Curriculum map", icon: "🗺️", tag: "Map" },
  textbook: { label: "Textbook", icon: "📚", tag: "Book" },
  workbook: { label: "Workbook", icon: "✏️", tag: "Workbook" },
};

// Exam papers and mark schemes need an exam year, paper number and session.
export const needsYearAndPaper = (t) => t === "exam_paper" || t === "mark_scheme";