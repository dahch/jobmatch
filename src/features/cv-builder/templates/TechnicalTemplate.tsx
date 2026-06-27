import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { OptimizedCV } from "@/shared/types";

const styles = StyleSheet.create({
  page: { padding: 36, fontSize: 9, fontFamily: "Courier", color: "#111" },
  name: { fontSize: 18, fontFamily: "Courier-Bold", marginBottom: 2 },
  contact: {
    fontSize: 8,
    color: "#555",
    marginBottom: 14,
    flexDirection: "row" as const,
    flexWrap: "wrap" as const,
  },
  contactItem: { marginRight: 12 },
  section: { marginBottom: 10 },
  sectionTitle: {
    fontSize: 10,
    fontFamily: "Courier-Bold",
    backgroundColor: "#111",
    color: "#fff",
    padding: "3 6",
    marginBottom: 6,
  },
  jobRow: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    marginBottom: 2,
  },
  jobTitle: { fontFamily: "Courier-Bold", fontSize: 9 },
  dates: { fontSize: 8, color: "#666" },
  company: { fontSize: 8, color: "#444", marginBottom: 3 },
  bullet: { fontSize: 8, marginLeft: 8, marginBottom: 1.5 },
  skillGrid: { flexDirection: "row" as const, flexWrap: "wrap" as const },
  skillTag: {
    fontSize: 7,
    backgroundColor: "#e5e7eb",
    padding: "2 5",
    borderRadius: 2,
    marginRight: 4,
    marginBottom: 4,
  },
  summary: { fontSize: 8, color: "#333", lineHeight: 1.4 },
});

export function TechnicalTemplate({ cv }: { cv: OptimizedCV }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.name}>{cv.full_name}</Text>
        <View style={styles.contact}>
          {cv.contact.email && (
            <Text style={styles.contactItem}>{cv.contact.email}</Text>
          )}
          {cv.contact.phone && (
            <Text style={styles.contactItem}>{cv.contact.phone}</Text>
          )}
          {cv.contact.location && (
            <Text style={styles.contactItem}>{cv.contact.location}</Text>
          )}
          {cv.contact.github && (
            <Text style={styles.contactItem}>{cv.contact.github}</Text>
          )}
          {cv.contact.linkedin && (
            <Text style={styles.contactItem}>{cv.contact.linkedin}</Text>
          )}
        </View>

        {cv.summary && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>SUMMARY</Text>
            <Text style={styles.summary}>{cv.summary}</Text>
          </View>
        )}

        {cv.skills.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>TECH STACK</Text>
            {cv.skills.map((cat, i) => (
              <View key={i} style={{ marginBottom: 4 }}>
                <Text
                  style={{
                    fontSize: 8,
                    fontFamily: "Courier-Bold",
                    marginBottom: 2,
                  }}
                >
                  {cat.category}:
                </Text>
                <View style={styles.skillGrid}>
                  {cat.items.map((item, j) => (
                    <Text key={j} style={styles.skillTag}>
                      {item}
                    </Text>
                  ))}
                </View>
              </View>
            ))}
          </View>
        )}

        {cv.work_experience.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>EXPERIENCE</Text>
            {cv.work_experience.map((exp, i) => (
              <View key={i} style={{ marginBottom: 8 }}>
                <View style={styles.jobRow}>
                  <Text style={styles.jobTitle}>
                    {exp.title} @ {exp.company}
                  </Text>
                  <Text style={styles.dates}>
                    {exp.start_date} — {exp.end_date || "Present"}
                  </Text>
                </View>
                {exp.location && (
                  <Text style={styles.company}>{exp.location}</Text>
                )}
                {exp.technologies.length > 0 && (
                  <Text style={{ fontSize: 7, color: "#666", marginBottom: 2 }}>
                    [{exp.technologies.join(" | ")}]
                  </Text>
                )}
                {exp.description && (
                  <Text style={styles.bullet}>{exp.description}</Text>
                )}
                {exp.achievements.map((a, j) => (
                  <Text key={j} style={styles.bullet}>
                    * {a}
                  </Text>
                ))}
              </View>
            ))}
          </View>
        )}

        {cv.projects && cv.projects.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>PROJECTS</Text>
            {cv.projects.map((p, i) => (
              <View key={i} style={{ marginBottom: 4 }}>
                <Text style={{ fontSize: 8, fontFamily: "Courier-Bold" }}>
                  {p.name}
                </Text>
                <Text style={{ fontSize: 7, color: "#666" }}>
                  [{p.technologies.join(", ")}]
                </Text>
                <Text style={styles.bullet}>{p.description}</Text>
              </View>
            ))}
          </View>
        )}

        {cv.education.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>EDUCATION</Text>
            {cv.education.map((edu, i) => (
              <Text key={i} style={{ fontSize: 8, marginBottom: 2 }}>
                {edu.degree}
                {edu.field ? ` in ${edu.field}` : ""} — {edu.institution}
                {edu.end_date ? ` (${edu.end_date})` : ""}
              </Text>
            ))}
          </View>
        )}

        {cv.languages && cv.languages.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>LANGUAGES</Text>
            <Text style={{ fontSize: 8 }}>
              {cv.languages.map((l) => `${l.language}: ${l.level}`).join(" | ")}
            </Text>
          </View>
        )}
      </Page>
    </Document>
  );
}
