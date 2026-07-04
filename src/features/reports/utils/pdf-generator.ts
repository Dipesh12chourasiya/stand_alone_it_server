import type { IReport } from '../models/report.model';

// ─── Simple HTML-based PDF generator ────────────────────────────
// Uses the native PDF generation approach — produces an HTML string
// that can be rendered to PDF via puppeteer or wkhtmltopdf.
//
// For MVP we return the HTML and let the controller pipe it through
// a PDF converter. When puppeteer is added, change renderPdf to
// call puppeteer.launch → page.setContent → page.pdf().

/**
 * Format a Date or ISO string to a human-readable format.
 */
function fmtDate(date: Date | string | undefined): string {
  if (!date) return '—';
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function fmtTime(date: Date | string | undefined): string {
  if (!date) return '—';
  const d = new Date(date);
  return d.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Generate an HTML document for a report.
 * Ready to be converted to PDF by puppeteer or a similar tool.
 */
export function generateReportHtml(report: IReport): string {
  const interview = report.interview;
  const recruiter = report.recruiter;
  const dv = report.deviceVerification;
  const timeline = report.timelineSummary || [];
  const connections = report.connectionHistory || [];

  const timelineRows = timeline
    .map(
      (e) => `
        <tr>
          <td style="padding:6px 8px;border-bottom:1px solid #eee;font-size:11px;color:#666;">${fmtDate(e.createdAt)} ${fmtTime(e.createdAt)}</td>
          <td style="padding:6px 8px;border-bottom:1px solid #eee;font-size:12px;">
            <span style="display:inline-block;padding:2px 6px;border-radius:4px;font-size:10px;font-weight:600;
              ${e.severity === 'ERROR' ? 'background:#fee2e2;color:#991b1b;' : ''}
              ${e.severity === 'WARNING' ? 'background:#fef3c7;color:#92400e;' : ''}
              ${e.severity === 'SUCCESS' ? 'background:#d1fae5;color:#065f46;' : ''}
              ${e.severity === 'INFO' ? 'background:#e0e7ff;color:#3730a3;' : ''}
            ">${e.severity}</span>
          </td>
          <td style="padding:6px 8px;border-bottom:1px solid #eee;font-size:12px;">${e.eventType}</td>
          <td style="padding:6px 8px;border-bottom:1px solid #eee;font-size:12px;">${e.message}</td>
        </tr>`,
    )
    .join('');

  const connectionRows = connections
    .map(
      (c) => `
        <tr>
          <td style="padding:6px 8px;border-bottom:1px solid #eee;font-size:12px;text-transform:capitalize;">${c.role}</td>
          <td style="padding:6px 8px;border-bottom:1px solid #eee;font-size:12px;">${fmtDate(c.connectedAt)} ${fmtTime(c.connectedAt)}</td>
          <td style="padding:6px 8px;border-bottom:1px solid #eee;font-size:12px;">${c.disconnectedAt ? fmtDate(c.disconnectedAt) + ' ' + fmtTime(c.disconnectedAt) : '—'}</td>
          <td style="padding:6px 8px;border-bottom:1px solid #eee;font-size:12px;">${c.duration ?? '—'} min</td>
        </tr>`,
    )
    .join('');

  const deviceChecks = dv
    ? dv.checks
        .map(
          (c) => `
            <tr>
              <td style="padding:4px 8px;font-size:12px;">${c.name}</td>
              <td style="padding:4px 8px;font-size:12px;">
                <span style="color:${c.status === 'pass' ? '#059669' : '#dc2626'};font-weight:600;">${c.status.toUpperCase()}</span>
              </td>
            </tr>`,
        )
        .join('')
    : '';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <style>
    @page { margin: 20mm 15mm; }
    body { font-family: 'Inter', 'Helvetica Neue', Arial, sans-serif; color: #1f2937; font-size: 12px; line-height: 1.5; }
    .header { text-align: center; padding: 20px 0 10px; border-bottom: 2px solid #1f2937; margin-bottom: 20px; }
    .logo { font-size: 22px; font-weight: 700; letter-spacing: -0.5px; color: #1f2937; }
    .subtitle { font-size: 11px; color: #6b7280; margin-top: 4px; }
    h2 { font-size: 14px; font-weight: 600; color: #111827; border-bottom: 1px solid #e5e7eb; padding-bottom: 6px; margin: 20px 0 12px; }
    .info-grid { display: flex; flex-wrap: wrap; gap: 12px; }
    .info-item { flex: 1; min-width: 200px; }
    .info-label { font-size: 10px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; }
    .info-value { font-size: 13px; font-weight: 500; margin-top: 2px; }
    table { width: 100%; border-collapse: collapse; margin-top: 6px; }
    th { text-align: left; padding: 8px; font-size: 11px; font-weight: 600; color: #6b7280; text-transform: uppercase; border-bottom: 2px solid #e5e7eb; }
    .summary-box { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; padding: 12px; display: flex; gap: 16px; flex-wrap: wrap; }
    .summary-stat { text-align: center; padding: 8px 16px; }
    .summary-stat .value { font-size: 18px; font-weight: 700; }
    .summary-stat .label { font-size: 10px; color: #6b7280; text-transform: uppercase; }
    .footer { text-align: center; font-size: 10px; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 12px; margin-top: 30px; }
    .notes-box { background: #fffbeb; border: 1px solid #fde68a; border-radius: 6px; padding: 12px; font-size: 12px; margin-top: 8px; }
  </style>
</head>
<body>

  <div class="header">
    <div class="logo">Interview Guard AI</div>
    <div class="subtitle">Interview Report &mdash; ${fmtDate(interview.date)}</div>
  </div>

  <!-- Summary -->
  <h2>Interview Summary</h2>
  <div class="summary-box">
    <div class="summary-stat">
      <div class="value">${interview.duration}</div>
      <div class="label">Duration (min)</div>
    </div>
    <div class="summary-stat">
      <div class="value" style="color:${interview.status === 'Completed' ? '#059669' : '#d97706'}">${interview.status}</div>
      <div class="label">Status</div>
    </div>
    <div class="summary-stat">
      <div class="value">${timeline.length}</div>
      <div class="label">Events</div>
    </div>
    <div class="summary-stat">
      <div class="value">${dv && dv.overall === 'pass' ? '✅' : dv ? '❌' : '—'}</div>
      <div class="label">Device Check</div>
    </div>
  </div>

  <!-- Interview Information -->
  <h2>Interview Information</h2>
  <div class="info-grid">
    <div class="info-item">
      <div class="info-label">Title</div>
      <div class="info-value">${interview.title}</div>
    </div>
    <div class="info-item">
      <div class="info-label">Platform</div>
      <div class="info-value">${interview.meetingPlatform}</div>
    </div>
    <div class="info-item">
      <div class="info-label">Date &amp; Time</div>
      <div class="info-value">${fmtDate(interview.date)} at ${interview.time}</div>
    </div>
    <div class="info-item">
      <div class="info-label">Meeting Link</div>
      <div class="info-value" style="font-size:11px;">${interview.meetingLink}</div>
    </div>
  </div>

  <!-- Candidate & Recruiter -->
  <h2>People</h2>
  <div class="info-grid">
    <div class="info-item">
      <div class="info-label">Candidate</div>
      <div class="info-value">${interview.candidateName}</div>
      <div style="font-size:11px;color:#6b7280;">${interview.candidateEmail}</div>
      ${interview.candidatePhone ? `<div style="font-size:11px;color:#6b7280;">${interview.candidatePhone}</div>` : ''}
    </div>
    ${recruiter ? `
    <div class="info-item">
      <div class="info-label">Recruiter</div>
      <div class="info-value">${recruiter.name}</div>
      <div style="font-size:11px;color:#6b7280;">${recruiter.email}</div>
      <div style="font-size:11px;color:#6b7280;">${recruiter.company}</div>
    </div>
    ` : ''}
  </div>

  <!-- Device Verification -->
  ${dv ? `
  <h2>Device Verification</h2>
  <table>
    <thead>
      <tr><th>Check</th><th>Result</th></tr>
    </thead>
    <tbody>
      ${deviceChecks}
      ${dv.browser ? `<tr><td style="padding:4px 8px;font-size:12px;color:#6b7280;">Browser</td><td style="padding:4px 8px;font-size:12px;">${dv.browser}</td></tr>` : ''}
      ${dv.operatingSystem ? `<tr><td style="padding:4px 8px;font-size:12px;color:#6b7280;">OS</td><td style="padding:4px 8px;font-size:12px;">${dv.operatingSystem}</td></tr>` : ''}
      ${dv.screenResolution ? `<tr><td style="padding:4px 8px;font-size:12px;color:#6b7280;">Resolution</td><td style="padding:4px 8px;font-size:12px;">${dv.screenResolution}</td></tr>` : ''}
    </tbody>
  </table>
  ` : ''}

  <!-- Connection History -->
  ${connections.length ? `
  <h2>Connection History</h2>
  <table>
    <thead>
      <tr><th>Role</th><th>Connected</th><th>Disconnected</th><th>Duration</th></tr>
    </thead>
    <tbody>${connectionRows}</tbody>
  </table>
  ` : ''}

  <!-- Timeline -->
  ${timeline.length ? `
  <h2>Timeline (${timeline.length} events)</h2>
  <table>
    <thead>
      <tr><th>Timestamp</th><th>Severity</th><th>Event</th><th>Message</th></tr>
    </thead>
    <tbody>${timelineRows}</tbody>
  </table>
  ` : ''}

  <!-- Notes -->
  ${report.notes ? `
  <h2>Notes</h2>
  <div class="notes-box">${report.notes.replace(/\n/g, '<br>')}</div>
  ` : ''}

  <div class="footer">
    <p>Generated by Interview Guard AI on ${fmtDate(new Date())} &bull; Confidential</p>
    <p style="font-size:9px;">This report contains sensitive interview data. Handle according to your organization's data policies.</p>
  </div>

</body>
</html>`;
}

/**
 * Generate report metadata for PDF filename.
 */
export function getPdfFilename(report: IReport): string {
  const candidate = report.interview.candidateName.replace(/\s+/g, '_');
  const date = fmtDate(report.interview.date).replace(/\s+/g, '_');
  return `Interview_Report_${candidate}_${date}.pdf`;
}
