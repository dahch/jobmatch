import type { ParsedCV, JobOffer } from "@/shared/types";

export interface MatchResult {
  score: number;
  breakdown: {
    skills: number;
    experience: number;
    technologies: number;
    seniority: number;
  };
  matchedSkills: string[];
  missingSkills: string[];
  matchedTech: string[];
  missingTech: string[];
}

export function calculateMatchScore(cv: ParsedCV, job: JobOffer): MatchResult {
  const cvSkills = new Set(
    cv.skills.flatMap((s) => (s.items || []).map((i) => i.toLowerCase())),
  );
  const cvTech = new Set(
    cv.work_experience.flatMap((e) =>
      (e.technologies || []).map((t) => t.toLowerCase()),
    ),
  );
  const jobTech = new Set(
    job.extracted_requirements.technologies.map((t) => t.toLowerCase()),
  );
  const jobMustHave = new Set(
    job.extracted_requirements.must_have.map((s) => s.toLowerCase()),
  );
  const jobNiceToHave = new Set(
    job.extracted_requirements.nice_to_have.map((s) => s.toLowerCase()),
  );
  const jobKeywords = new Set(job.ats_keywords.map((k) => k.toLowerCase()));

  // Skills match (what the JD requires that the CV has)
  const allJobReqs = new Set([
    ...jobMustHave,
    ...jobNiceToHave,
    ...jobKeywords,
  ]);
  const matchedSkills: string[] = [];
  const missingSkills: string[] = [];

  for (const req of allJobReqs) {
    const found =
      cvSkills.has(req) ||
      [...cvTech].some((t) => req.includes(t) || t.includes(req)) ||
      cv.work_experience.some(
        (e) =>
          (e.description || "").toLowerCase().includes(req) ||
          (e.achievements || []).some((a) => a.toLowerCase().includes(req)),
      );
    if (found) {
      matchedSkills.push(req);
    } else {
      missingSkills.push(req);
    }
  }

  const skillsScore =
    allJobReqs.size > 0
      ? Math.round((matchedSkills.length / allJobReqs.size) * 100)
      : 50;

  // Technologies match
  const matchedTech: string[] = [];
  const missingTech: string[] = [];

  for (const tech of jobTech) {
    const found =
      cvTech.has(tech) ||
      cvSkills.has(tech) ||
      cv.work_experience.some((e) =>
        (e.technologies || []).some(
          (t) => t.toLowerCase() === tech || t.toLowerCase().includes(tech),
        ),
      );
    if (found) {
      matchedTech.push(tech);
    } else {
      missingTech.push(tech);
    }
  }

  const techScore =
    jobTech.size > 0
      ? Math.round((matchedTech.length / jobTech.size) * 100)
      : 50;

  // Experience level match
  const totalYears = cv.work_experience.reduce((acc, exp) => {
    const start = parseYear(exp.start_date);
    const end = exp.end_date
      ? parseYear(exp.end_date)
      : new Date().getFullYear();
    return acc + Math.max(0, end - start);
  }, 0);

  const requiredYears = job.extracted_requirements.years_experience;
  let expScore = 70; // default
  if (requiredYears) {
    if (totalYears >= requiredYears) {
      expScore = 100;
    } else if (totalYears >= requiredYears - 1) {
      expScore = 80;
    } else if (totalYears >= requiredYears - 2) {
      expScore = 60;
    } else {
      expScore = 40;
    }
  }

  // Seniority match
  const cvLevel = inferSeniority(totalYears);
  const jobLevel =
    job.extracted_requirements.seniority_level?.toLowerCase() || "";
  let seniorityScore = 60;
  if (!jobLevel || jobLevel === "any") {
    seniorityScore = 80;
  } else if (
    (jobLevel.includes("senior") && cvLevel === "senior") ||
    (jobLevel.includes("mid") && cvLevel === "mid") ||
    (jobLevel.includes("junior") && cvLevel === "junior") ||
    (jobLevel.includes("staff") && cvLevel === "staff")
  ) {
    seniorityScore = 100;
  } else {
    seniorityScore = 50;
  }

  // Weighted final score
  const score = Math.round(
    skillsScore * 0.3 +
      techScore * 0.35 +
      expScore * 0.2 +
      seniorityScore * 0.15,
  );

  return {
    score: Math.min(100, Math.max(0, score)),
    breakdown: {
      skills: skillsScore,
      experience: expScore,
      technologies: techScore,
      seniority: seniorityScore,
    },
    matchedSkills,
    missingSkills: missingSkills.slice(0, 10),
    matchedTech,
    missingTech: missingTech.slice(0, 10),
  };
}

function parseYear(dateStr: string): number {
  const match = dateStr.match(/(\d{4})/);
  return match ? parseInt(match[1], 10) : 2020;
}

function inferSeniority(years: number): string {
  if (years >= 8) return "staff";
  if (years >= 5) return "senior";
  if (years >= 2) return "mid";
  return "junior";
}
