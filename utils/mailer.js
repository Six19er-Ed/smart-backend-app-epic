const nodemailer = require("nodemailer");
require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });

async function sendAlertEmail(alerts) {
  if (alerts.length === 0) {
    console.log("No abnormal results - no email sent.");
    return;
  }

  const testAccount = await nodemailer.createTestAccount();
  const transporter = nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass
    }
  });

  const rows = alerts.map(a =>
    "<tr><td>" + a.patientName + "</td><td>" + a.test + "</td><td>" + a.value + "</td><td>" + a.interpretation + "</td><td>" + a.date + "</td></tr>"
  ).join("");

  const html = "<h2>Abnormal Lab Alert</h2><p>" + alerts.length + " abnormal result(s) detected.</p><table border='1' cellpadding='8'><thead><tr><th>Patient</th><th>Test</th><th>Value</th><th>Flag</th><th>Date</th></tr></thead><tbody>" + rows + "</tbody></table>";

  const info = await transporter.sendMail({
    from: testAccount.user,
    to: testAccount.user,
    subject: alerts.length + " Abnormal Lab Result(s) Detected",
    html
  });

  console.log("Email sent! Preview URL: " + nodemailer.getTestMessageUrl(info));
}

module.exports = { sendAlertEmail };