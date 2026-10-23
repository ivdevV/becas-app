import assert from "node:assert/strict";
import test from "node:test";
import nodemailer from "nodemailer";

test("sendMail accepts the fields used by the scholarship notification", async () => {
  const transporter = nodemailer.createTransport({ jsonTransport: true });
  const info = await transporter.sendMail({
    from: "Becas IRG <becas.irg@institutoraimongaja.com>",
    to: "becas.irg@institutoraimongaja.com",
    replyTo: "alumno@example.com",
    subject: "Nueva solicitud de beca: Ana",
    text: "Referencia: abc",
    html: "<p>Referencia: abc</p>",
  });

  const message = typeof info.message === "string" ? info.message : String(info.message);
  assert.match(message, /Nueva solicitud de beca: Ana/);
  assert.match(message, /alumno@example.com/);
  assert.match(message, /Referencia: abc/);
});
