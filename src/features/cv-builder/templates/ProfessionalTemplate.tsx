import { useMemo } from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { OptimizedCV } from "@/shared/types";

interface ProfessionalTemplateProps {
  cv: OptimizedCV;
  accentColor?: string;
}

const baseColors = {
  dark: "#111827",
  medium: "#4b5563",
  light: "#9ca3af",
  bg: "#f3f4f6",
};

export function ProfessionalTemplate({
  cv,
  accentColor = "#2563eb",
}: ProfessionalTemplateProps) {
  const styles = useMemo(() => {
    return StyleSheet.create({
      page: { fontSize: 9, fontFamily: "Helvetica", color: baseColors.dark },
      row: { flexDirection: "row" },
      sidebar: { width: "35%", backgroundColor: baseColors.bg, padding: 20 },
      main: { width: "65%", padding: 20 },
      name: {
        fontSize: 20,
        fontFamily: "Helvetica-Bold",
        color: accentColor,
        marginBottom: 4,
      },
      sidebarSection: { marginBottom: 12 },
      sectionTitle: {
        fontSize: 10,
        fontFamily: "Helvetica-Bold",
        color: accentColor,
        textTransform: "uppercase" as const,
        marginBottom: 4,
      },
      contactItem: { fontSize: 8, color: baseColors.medium, marginBottom: 2 },
      skillItem: { fontSize: 8, color: baseColors.dark, marginBottom: 2 },
      jobTitle: {
        fontFamily: "Helvetica-Bold",
        fontSize: 9,
        color: baseColors.dark,
      },
      company: { fontSize: 8, color: baseColors.medium },
      dates: { fontSize: 7, color: baseColors.light },
      bullet: {
        fontSize: 8,
        color: baseColors.dark,
        marginLeft: 8,
        marginBottom: 2,
      },
      summary: {
        fontSize: 8,
        color: baseColors.medium,
        lineHeight: 1.4,
        marginBottom: 12,
      },
    });
  }, [accentColor]);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.row}>
          {/* Sidebar */}
          <View style={styles.sidebar}>
            <Text style={styles.name}>{cv.full_name}</Text>

            <View style={styles.sidebarSection}>
              <Text style={styles.sectionTitle}>Contact</Text>
              {cv.contact.email && (
                <Text style={styles.contactItem}>{cv.contact.email}</Text>
              )}
              {cv.contact.phone && (
                <Text style={styles.contactItem}>{cv.contact.phone}</Text>
              )}
              {cv.contact.location && (
                <Text style={styles.contactItem}>{cv.contact.location}</Text>
              )}
              {cv.contact.linkedin && (
                <Text style={styles.contactItem}>{cv.contact.linkedin}</Text>
              )}
              {cv.contact.github && (
                <Text style={styles.contactItem}>{cv.contact.github}</Text>
              )}
            </View>

            {cv.skills.length > 0 && (
              <View style={styles.sidebarSection}>
                <Text style={styles.sectionTitle}>Skills</Text>
                {cv.skills.map((cat, i) => (
                  <View key={i} style={{ marginBottom: 4 }}>
                    <Text
                      style={{
                        fontSize: 8,
                        fontFamily: "Helvetica-Bold",
                        color: baseColors.dark,
                      }}
                    >
                      {cat.category}
                    </Text>
                    {cat.items.map((item, j) => (
                      <Text key={j} style={styles.skillItem}>
                        {item}
                      </Text>
                    ))}
                  </View>
                ))}
              </View>
            )}

            {cv.languages && cv.languages.length > 0 && (
              <View style={styles.sidebarSection}>
                <Text style={styles.sectionTitle}>Languages</Text>
                {cv.languages.map((l, i) => (
                  <Text key={i} style={styles.contactItem}>
                    {l.language} — {l.level}
                  </Text>
                ))}
              </View>
            )}

            {cv.education.length > 0 && (
              <View style={styles.sidebarSection}>
                <Text style={styles.sectionTitle}>Education</Text>
                {cv.education.map((edu, i) => (
                  <View key={i} style={{ marginBottom: 4 }}>
                    <Text style={{ fontSize: 8, fontFamily: "Helvetica-Bold" }}>
                      {edu.degree}
                    </Text>
                    <Text style={{ fontSize: 7, color: baseColors.medium }}>
                      {edu.institution}
                    </Text>
                    {edu.end_date && (
                      <Text style={{ fontSize: 7, color: baseColors.light }}>
                        {edu.end_date}
                      </Text>
                    )}
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Main */}
          <View style={styles.main}>
            {cv.summary && (
              <View style={{ marginBottom: 12 }}>
                <Text style={styles.sectionTitle}>Profile</Text>
                <Text style={styles.summary}>{cv.summary}</Text>
              </View>
            )}

            {cv.work_experience.length > 0 && (
              <View style={{ marginBottom: 12 }}>
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

            {cv.projects && cv.projects.length > 0 && (
              <View>
                <Text style={styles.sectionTitle}>Projects</Text>
                {cv.projects.map((p, i) => (
                  <View key={i} style={{ marginBottom: 4 }}>
                    <Text style={{ fontSize: 8, fontFamily: "Helvetica-Bold" }}>
                      {p.name}
                    </Text>
                    <Text style={{ fontSize: 8, color: baseColors.medium }}>
                      {p.description}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>
      </Page>
    </Document>
  );
}
