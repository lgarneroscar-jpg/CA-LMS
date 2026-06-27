const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export async function sendProgramCompletionEmail(params: {
  to: string;
  studentName: string;
  institutionName: string;
  studentId: string;
  completedAt: string;
}) {
  const certificateUrl = `${APP_URL}/certificate/${params.studentId}`;
  const linkedInCaption = `I'm proud to share that I've completed the Corporate Academy program at ${params.institutionName} — building my pre-professional identity, communication skills, and career strategy. #CorporateAcademy #CareerReady`;

  const body = {
    to: params.to,
    subject: "Congratulations — You're Corporate Academy Certified!",
    html: `
      <p>Hi ${params.studentName},</p>
      <p>Congratulations on completing Corporate Academy! Your certificate is ready:</p>
      <p><a href="${certificateUrl}">${certificateUrl}</a></p>
      <p><strong>Suggested LinkedIn post:</strong></p>
      <blockquote>${linkedInCaption}</blockquote>
    `,
    linkedInCaption,
    certificateUrl,
  };

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.info("[sendProgramCompletionEmail] (dev — no RESEND_API_KEY)", body);
    return { sent: false, certificateUrl, linkedInCaption };
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Corporate Academy <hello@corpacad.com>",
      to: params.to,
      subject: body.subject,
      html: body.html,
    }),
  });

  if (!res.ok) {
    console.error("[sendProgramCompletionEmail]", await res.text());
    return { sent: false, certificateUrl, linkedInCaption };
  }

  return { sent: true, certificateUrl, linkedInCaption };
}

export async function sendBehindPaceEmail(params: {
  to: string;
  studentName: string;
  progressWeek: number;
  expectedWeek: number;
}) {
  const dashboardUrl = `${APP_URL}/dashboard`;
  const body = {
    to: params.to,
    subject: "You're behind pace — your next module is waiting",
    html: `
      <p>Hi ${params.studentName},</p>
      <p>You're a bit behind your program pace. You're on Week ${params.progressWeek} content, but Week ${params.expectedWeek} is where your schedule expects you to be.</p>
      <p>Your next module is ready whenever you are — jump back in:</p>
      <p><a href="${dashboardUrl}">${dashboardUrl}</a></p>
      <p>— Corporate Academy</p>
    `,
  };

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.info("[sendBehindPaceEmail] (dev — no RESEND_API_KEY)", body);
    return { sent: false };
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Corporate Academy <hello@corpacad.com>",
      to: params.to,
      subject: body.subject,
      html: body.html,
    }),
  });

  if (!res.ok) {
    console.error("[sendBehindPaceEmail]", await res.text());
    return { sent: false };
  }

  return { sent: true };
}
