import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { OptimizedCV } from "@/shared/types";

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#1a1a1a",
  },
  name: { fontSize: 22, fontFamily: "Helvetica-Bold", marginBottom: 4 },
  contact: { fontSize: 9, color: "#555", marginBottom: 16 },
  section: { marginBottom: 12 },
  sectionTitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase" as const,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
    paddingBottom: 3,
    marginBottom: 6,
  },
  jobTitle: { fontFamily: "Helvetica-Bold", fontSize: 10 },
  company: { fontSize: 9, color: "#555" },
  dates: { fontSize: 8, color: "#888" },
  bullet: { fontSize: 9, marginLeft: 10, marginBottom: 2 },
  skillCategory: { fontFamily: "Helvetica-Bold", fontSize: 9 },
  skillItems: { fontSize: 9, color: "#333" },
  summary: { fontSize: 9, lineHeight: 1.4, color: "#333" },
});

export function MinimalTemplate({ cv }: { cv: OptimizedCV }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.name}>{cv.full_name}</Text>
        <Text style={styles.contact}>
          {[
            cv.contact.email,
            cv.contact.phone,
            cv.contact.location,
            cv.contact.linkedin,
          ]
            .filter(Boolean)
            .join(" · ")}
        </Text>

        {cv.summary && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Summary</Text>
            <Text style={styles.summary}>{cv.summary}</Text>
          </View>
        )}

        {cv.work_experience.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Experience</Text>
            {cv.work_experience.map((exp, i) => (
              <View key={i} style={{ marginBottom: 8 }}>
                <Text style={styles.jobTitle}>{exp.title}</Text>
                <Text style={styles.company}>
                  {exp.company}
                  {exp.location ? ` · ${exp.location}` : ""}
                </Text>
                <Text style={styles.dates}>
                  {exp.start_date} — {exp.end_date || "Present"}
                </Text>
                {exp.description && (
                  <Text style={styles.bullet}>{exp.description}</Text>
                )}
                {exp.achievements.map((a, j) => (
                  <Text key={j} style={styles.bullet}>
                    • {a}
                  </Text>
                ))}
              </View>
            ))}
          </View>
        )}

        {cv.skills.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Skills</Text>
            {cv.skills.map((cat, i) => (
              <Text key={i} style={{ fontSize: 9, marginBottom: 2 }}>
                <Text style={styles.skillCategory}>{cat.category}: </Text>
                <Text style={styles.skillItems}>{cat.items.join(", ")}</Text>
              </Text>
            ))}
          </View>
        )}

        {cv.education.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Education</Text>
            {cv.education.map((edu, i) => (
              <Text key={i} style={{ fontSize: 9, marginBottom: 2 }}>
                {edu.degree}
                {edu.field ? ` in ${edu.field}` : ""} — {edu.institution}
                {edu.end_date ? ` (${edu.end_date})` : ""}
              </Text>
            ))}
          </View>
        )}

        {cv.languages && cv.languages.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Languages</Text>
            <Text style={{ fontSize: 9 }}>
              {cv.languages.map((l) => `${l.language} (${l.level})`).join(", ")}
            </Text>
          </View>
        )}
      </Page>
    </Document>
  );
}
