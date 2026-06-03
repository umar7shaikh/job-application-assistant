import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

const INK = "#14171C";
const SOFT = "#4A4F57";
const LINE = "#D2D4CD";

const s = StyleSheet.create({
  page: {
    paddingTop: 56,
    paddingBottom: 56,
    paddingHorizontal: 64,
    fontSize: 10.5,
    fontFamily: "Helvetica",
    color: INK,
    lineHeight: 1.55,
  },
  name: { fontSize: 16, fontFamily: "Helvetica-Bold" },
  contact: { fontSize: 9, color: SOFT, marginTop: 3 },
  rule: { borderBottomWidth: 1, borderBottomColor: LINE, marginVertical: 14 },
  para: { marginBottom: 10 },
});

export function CoverLetterDoc({
  name,
  contactLine,
  body,
}: {
  name: string;
  contactLine: string;
  body: string;
}) {
  const paragraphs = body.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  return (
    <Document title={`Cover letter — ${name}`} author={name}>
      <Page size="A4" style={s.page}>
        <View>
          <Text style={s.name}>{name || "Your Name"}</Text>
          {contactLine ? <Text style={s.contact}>{contactLine}</Text> : null}
        </View>
        <View style={s.rule} />
        {paragraphs.map((p, i) => (
          <Text key={i} style={s.para}>
            {p}
          </Text>
        ))}
      </Page>
    </Document>
  );
}

/** Factory so non-JSX route handlers can build the element cleanly. */
export const coverElement = (props: {
  name: string;
  contactLine: string;
  body: string;
}) => <CoverLetterDoc {...props} />;
