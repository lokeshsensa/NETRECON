import io
import csv
import json
from datetime import datetime, timezone
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors

class ReportService:
    @staticmethod
    def generate_json_report(scan_data: dict) -> str:
        return json.dumps(scan_data, indent=2, default=str)

    @staticmethod
    def generate_csv_report(scan_data: dict) -> str:
        output = io.StringIO()
        writer = csv.writer(output)

        # Header Metadata
        writer.writerow(["NETRECON ASSESSMENT REPORT"])
        writer.writerow(["Scan ID", scan_data.get("id")])
        writer.writerow(["Target", scan_data.get("target")])
        writer.writerow(["Profile", scan_data.get("profile")])
        writer.writerow(["Status", scan_data.get("status")])
        writer.writerow(["Start Time", scan_data.get("start_time")])
        writer.writerow([])

        # Hosts & Ports Section
        writer.writerow(["HOST DISCOVERY & PORTS"])
        writer.writerow(["Host IP", "Hostname", "Status", "Port", "Protocol", "Service", "Product", "Version"])

        hosts = scan_data.get("hosts", [])
        for host in hosts:
            ports = host.get("ports", [])
            if not ports:
                writer.writerow([
                    host.get("ip_address"),
                    host.get("hostname"),
                    host.get("status"),
                    "N/A", "N/A", "N/A", "N/A", "N/A"
                ])
            else:
                for p in ports:
                    writer.writerow([
                        host.get("ip_address"),
                        host.get("hostname"),
                        host.get("status"),
                        p.get("port_number"),
                        p.get("protocol"),
                        p.get("service_name"),
                        p.get("product"),
                        p.get("version")
                    ])

        writer.writerow([])
        # Security Findings Section
        writer.writerow(["DEFENSIVE SECURITY FINDINGS"])
        writer.writerow(["Severity", "Host IP", "Port", "Title", "Description", "Remediation"])

        for host in hosts:
            for f in host.get("findings", []):
                writer.writerow([
                    f.get("severity"),
                    host.get("ip_address"),
                    f.get("port_number") or "N/A",
                    f.get("title"),
                    f.get("description"),
                    f.get("recommended_remediation")
                ])

        return output.getvalue()

    @staticmethod
    def generate_pdf_report(scan_data: dict) -> bytes:
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=letter,
            rightMargin=36,
            leftMargin=36,
            topMargin=36,
            bottomMargin=36
        )

        styles = getSampleStyleSheet()
        
        # Custom Dark SOC Theme Report Styles
        title_style = ParagraphStyle(
            'ReportTitle',
            parent=styles['Heading1'],
            fontSize=22,
            leading=26,
            textColor=colors.HexColor('#0F172A'),
            fontName='Helvetica-Bold'
        )

        h2_style = ParagraphStyle(
            'ReportH2',
            parent=styles['Heading2'],
            fontSize=14,
            leading=18,
            textColor=colors.HexColor('#1E293B'),
            fontName='Helvetica-Bold',
            spaceBefore=12,
            spaceAfter=6
        )

        normal_style = ParagraphStyle(
            'ReportNormal',
            parent=styles['Normal'],
            fontSize=10,
            leading=14,
            textColor=colors.HexColor('#334155')
        )

        disclaimer_style = ParagraphStyle(
            'ReportDisclaimer',
            parent=styles['Italic'],
            fontSize=9,
            leading=12,
            textColor=colors.HexColor('#64748B')
        )

        story = []

        # Header Block
        story.append(Paragraph("NETRECON — Security Assessment Report", title_style))
        story.append(Paragraph("Network Reconnaissance & Risk Visibility Engine", disclaimer_style))
        story.append(Spacer(1, 10))
        story.append(HRFlowable(width="100%", thickness=2, color=colors.HexColor('#3B82F6'), spaceAfter=15))

        # Metadata Table
        meta_data = [
            [Paragraph("<b>Target Network:</b>", normal_style), Paragraph(str(scan_data.get("target")), normal_style),
             Paragraph("<b>Scan Profile:</b>", normal_style), Paragraph(str(scan_data.get("profile")), normal_style)],
            [Paragraph("<b>Scan ID:</b>", normal_style), Paragraph(str(scan_data.get("id")), normal_style),
             Paragraph("<b>Scan Status:</b>", normal_style), Paragraph(str(scan_data.get("status")), normal_style)],
            [Paragraph("<b>Start Time:</b>", normal_style), Paragraph(str(scan_data.get("start_time")), normal_style),
             Paragraph("<b>Duration:</b>", normal_style), Paragraph(f"{scan_data.get('duration_seconds', 0)}s", normal_style)]
        ]
        t_meta = Table(meta_data, colWidths=[110, 160, 110, 160])
        t_meta.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#F8FAFC')),
            ('PADDING', (0, 0), (-1, -1), 6),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E2E8F0')),
        ]))
        story.append(t_meta)
        story.append(Spacer(1, 15))

        # Executive Summary
        story.append(Paragraph("1. Executive Summary", h2_style))
        hosts = scan_data.get("hosts", [])
        total_hosts = len(hosts)
        live_hosts = sum(1 for h in hosts if h.get("status") == "UP")
        total_ports = sum(len(h.get("ports", [])) for h in hosts)
        total_findings = sum(len(h.get("findings", [])) for h in hosts)

        exec_summary_text = (
            f"An authorized network security assessment was executed against target <b>{scan_data.get('target')}</b>. "
            f"The scanner identified <b>{total_hosts} total hosts</b> ({live_hosts} active/live), "
            f"exposing <b>{total_ports} open ports/services</b>, yielding <b>{total_findings} security risk findings</b>."
        )
        story.append(Paragraph(exec_summary_text, normal_style))
        story.append(Spacer(1, 15))

        # Host & Port Summary Table
        story.append(Paragraph("2. Discovered Hosts & Open Ports", h2_style))
        host_table_data = [["IP Address", "Hostname", "Status", "Open Ports", "Risk Level"]]
        
        for h in hosts:
            ports_list = ", ".join([str(p.get("port_number")) for p in h.get("ports", [])]) or "None"
            host_table_data.append([
                h.get("ip_address"),
                h.get("hostname") or "N/A",
                h.get("status"),
                ports_list,
                h.get("risk_level")
            ])

        t_hosts = Table(host_table_data, colWidths=[110, 130, 70, 140, 90])
        t_hosts.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1E293B')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('PADDING', (0, 0), (-1, -1), 5),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#CBD5E1')),
        ]))
        story.append(t_hosts)
        story.append(Spacer(1, 15))

        # Security Findings Table
        story.append(Paragraph("3. Defensive Security Risk Findings", h2_style))
        findings_table_data = [["Severity", "Host", "Finding Title", "Remediation Summary"]]

        for h in hosts:
            for f in h.get("findings", []):
                findings_table_data.append([
                    f.get("severity"),
                    h.get("ip_address"),
                    Paragraph(f.get("title", ""), normal_style),
                    Paragraph(f.get("recommended_remediation", ""), normal_style)
                ])

        if len(findings_table_data) == 1:
            findings_table_data.append(["INFO", "N/A", "No major security risk findings detected", "N/A"])

        t_findings = Table(findings_table_data, colWidths=[75, 95, 170, 200])
        t_findings.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#0F172A')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('PADDING', (0, 0), (-1, -1), 5),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#CBD5E1')),
        ]))
        story.append(t_findings)
        story.append(Spacer(1, 20))

        # Security Disclaimer Footer
        story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor('#94A3B8'), spaceBefore=10, spaceAfter=10))
        disclaimer = (
            "<b>AUTHORIZED USE DISCLAIMER:</b> This report is generated strictly for authorized security assessment, "
            "infrastructure defense, and educational monitoring. The scanning engine operates within standard "
            "non-destructive enumeration parameters."
        )
        story.append(Paragraph(disclaimer, disclaimer_style))

        doc.build(story)
        pdf_bytes = buffer.getvalue()
        buffer.close()
        return pdf_bytes
