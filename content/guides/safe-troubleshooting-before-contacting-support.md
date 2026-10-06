---
title: "Safe Troubleshooting Before Contacting Portal Support"
slug: "safe-troubleshooting-before-contacting-support"
---

# Safe Troubleshooting Before Contacting Portal Support

Essential, non-destructive diagnostic checks every citizen should perform before lodging official grievances or assuming a portal system failure.

## 1. Verify Device Clock Synchronization (IST)
Government portal authentication gateways (such as OTPs, 2FA, and Aadhaar e-Sign) strictly enforce cryptographic time-window validation. If your computer or smartphone clock deviates by more than 90 seconds from Indian Standard Time (IST), OTPs will be rejected as expired upon entry.

## 2. Clean Document Formatting & Password Removal
Over 40% of document upload rejections are due to password-protected e-Aadhaar PDFs or file names containing spaces and punctuation. Downloaded Aadhaar cards have a default 8-character password. Government ingestion servers cannot decrypt password-protected files. Always use "Print to PDF" to generate an unencrypted, cleanly named copy under 200 KB.

## 3. Respect the 24–48 Hour Banking Reconciliation Window
When money is deducted via UPI, NetBanking, or Debit Card but the portal indicates "Payment Failed" or "Pending Challan", treasury aggregators (Bharatkosh, SBI ePay) require nightly batch reconciliations. Never pay twice in panic. In 80% of cases, logging back in after 24 hours and clicking "Re-verify Payment" confirms the transaction.

## 4. Single-Tab Isolated Browsing
Government session cookies are tied to a single active session token. Opening multiple tabs for the same portal will scramble state parameters, resulting in an immediate "Session Expired" error.

## 5. Maintain Zero Trust Against Unofficial Intermediaries
Never share SMS OTPs, Aadhaar numbers, or banking credentials with third-party agents found on social media, Telegram, or unofficial search ads claiming to "expedite" your application.
