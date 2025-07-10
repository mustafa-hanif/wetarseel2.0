import * as React from "react";

interface EmailTemplateProps {
  firstName: string;
  resetLink: string;
}

export const EmailTemplate: React.FC<Readonly<EmailTemplateProps>> = ({
  firstName,
  resetLink,
}) => (
  <div
    style={{
      fontFamily: "Arial, sans-serif",
      lineHeight: "1.6",
      color: "black",
    }}
  >
    <table
      width="100%"
      cellPadding="0"
      cellSpacing="0"
      style={{
        background: "#f9f9f9",
        padding: "20px",
        maxWidth: "600px",
        margin: "auto",
        borderRadius: "10px",
      }}
    >
      <tbody>
        <tr>
          <td
            style={{
              padding: "20px",
              background: "#ffffff",
              borderRadius: "10px",
            }}
          >
            <h1 style={{ color: "#34A237" }}>Password Reset Request</h1>
            <p>Hi {firstName},</p>
            <p>
              We received a request to reset your password. Click the button
              below to reset your password:
            </p>
            <p style={{ textAlign: "center" }}>
              <a
                href={resetLink}
                style={{
                  display: "inline-block",
                  padding: "10px 20px",
                  fontSize: "16px",
                  color: "#ffffff",
                  backgroundColor: "#137416",
                  textDecoration: "none",
                  borderRadius: "5px",
                }}
              >
                Go to reset password link
              </a>
            </p>
            <p>
              If you did not request a password reset, please ignore this email
              or contact support if you have any questions.
            </p>
            <p>Thank you,</p>
            <p>WeTarseel Team</p>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
);
