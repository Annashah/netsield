import io, re
from xml.sax.saxutils import escape
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import SimpleDocTemplate, Paragraph, Table


def build(s):
    st, buf = getSampleStyleSheet(), io.BytesIO()
    clean = lambda l: re.sub(r" [^\w\s-]+ ", " - ", str(l))
    attacks = s["total"] - s["counts"].get("BENIGN", 0)

    def section(title, rows):
        return [Paragraph(title, st["Heading2"]), Table([[clean(a), str(b)] for a, b in rows], hAlign="LEFT")]

    story = [
        Paragraph("NetShield report", st["Title"]),
        Paragraph(f"File: {escape(s['file'])}<br/>Flows: {s['total']} | Attacks: {attacks} ({attacks / s['total'] * 100:.1f}%)"
                  f"<br/>Benign-labelled flows flagged as unusual: {s['odd']}", st["Normal"]),
        *section("Attack types", [(k, v) for k, v in s["counts"].items() if k != "BENIGN"]),
        *section("Top targeted ports", s["ports"]),
        *section("TCP flags set in attack flows", s["flags"].items()),
    ]
    SimpleDocTemplate(buf, pagesize=A4).build(story)
    return buf.getvalue()
