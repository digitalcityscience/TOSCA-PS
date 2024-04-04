import fs from "fs";
import puppeteer from "puppeteer";
import archiver from "archiver";

export function generateExport(workdir, report, bucket) {
  return new Promise(async (resolve, reject) => {
    try {
      const browser = await puppeteer.launch({
        args: ["--no-sandbox"],
      });
      const page = await browser.newPage();

      const objectionTemplates = {};

      // individual objections and attachments

      for (const objection of report.objections) {
        const attachmentIds = (
          Array.isArray(objection.attachmentId)
            ? objection.attachmentId
            : [objection.attachmentId]
        )
          .filter((e) => !!e)
          .map((objectId) => objectId.toString());
        const attachments = report.attachments.filter((attachment) =>
          attachmentIds.includes(attachment._id.toString())
        );
        const attachmentsHtml = attachments.map(
          (attachment) => `
        <tr><td>${attachment.filename}</td></tr>`
        );
        //Define export file detail
        // Change below for HH Wasser

        objectionTemplates[objection._id] =
          `
      <table>
        <tr><td>Date:</td><td>${objection.created}</td></tr>
        <tr><td>Category:</td><td>${
          objection.category ?? "not provided"
        }</td></tr>
        <tr><td>Content:</td><td>${objection.comment}</td></tr>
          <tr>
      <td>Location:</td>
      <td>Latitude: ${objection.location.lat ?? "not provided"}, Longitude: ${
            objection.location.lng ?? "not provided"
          }</td>
      </tr>      
      </table>
      <p>Objecting person:</p>
      <table>
        <tr><td>Name:</td><td>${
          objection.person.name ?? "not provided"
        }</td></tr>
        <tr><td>institution:</td><td>${
          objection.person.institution ?? "not provided"
        }</td></tr>
        <tr><td>department:</td><td>${
          objection.person.department ?? "not provided"
        }</td></tr>
        <tr><td>phone:</td><td>${
          objection.person.phone ?? "not provided"
        }</td></tr>
        <tr><td>email:</td><td>${
          objection.person.email ?? "not provided"
        }</td></tr>
      </table>
    ` +
          (attachmentsHtml.length
            ? `
      <p>Attached files:</p>
      <table>
        ${attachmentsHtml.join(`\n`)}
      </table>`
            : "");

        const dir = `${workdir}/objection-${objection._id}`;
        fs.mkdirSync(dir, { recursive: true });

        const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
        </head>
        <body>
          <h1>Citizen input report</h1>
          <p>This objection was filed against the DMP:</p>
          <table>
            <tr><td>Title:</td><td>${report.title}</td></tr>
            <tr><td>Layer name:</td><td>${report.layerName}</td></tr>
            <tr><td>MoLG ID:</td><td>${report.molgId}</td></tr>
          </table>
          <h2>Objection</h2>
          ${objectionTemplates[objection._id]}
        </body>
      </html>`;

        await page.setContent(html, { waitUntil: "domcontentloaded" });

        const reportFile = `${dir}/objection-${objection._id}.pdf`;

        await page.pdf({
          path: reportFile,
          margin: { top: "70px", right: "50px", bottom: "70px", left: "50px" },
          format: "A4",
        });

        for (const attachment of attachments) {
          bucket
            .openDownloadStream(attachment._id)
            .pipe(
              fs.createWriteStream(`${dir}/attachment-${attachment.filename}`)
            );
        }
      }

      // summary PDF

      const allObjectionsHtml = Object.values(objectionTemplates)
        .map(
          (template, index) => `
      <h2>Objection #${index + 1}</h2>
      ${template}
    `
        )
        .join(`\n`);

      const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
    </head>
    <body>
      <h1>Citizen input report</h1>
      <p>This report contains all objections filed against the DMP:</p>
      <table>
        <tr><td>Title:</td><td>${report.title}</td></tr>
        <tr><td>Layer name:</td><td>${report.layerName}</td></tr>
        <tr><td>MoLG ID:</td><td>${report.molgId}</td></tr>
      </table>
      ${allObjectionsHtml}
    </body>
    </html>`;

      await page.setContent(html, { waitUntil: "domcontentloaded" });

      const summaryReportFile = `${workdir}/objections-${report._id}.pdf`;

      await page.pdf({
        path: summaryReportFile,
        margin: { top: "70px", right: "50px", bottom: "70px", left: "50px" },
        format: "A4",
      });

      await browser.close();

      // Create archive

      const zipfile = `export/${report._id}.zip`;
      const writer = fs.createWriteStream(zipfile);
      const archive = archiver("zip");

      writer.on("close", () => {
        resolve(zipfile);
      });

      archive.pipe(writer);
      archive.directory(workdir, false);
      archive.finalize();
    } catch (err) {
      reject(err);
    }
  });
}
