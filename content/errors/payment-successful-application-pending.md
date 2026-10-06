---
title: "Payment Successful but Status Still Pending"
slug: "payment-successful-application-pending"
id: "ERR-11"
category: "Payment"
services: ["Passport", "Driving Licence", "PAN"]
search_intent: "payment successful application pending"
last_reviewed: "2026-10-06"
author: "Digital India Error Decoder Research Team"
---

# Payment Successful but Status Still Pending — Meaning, Causes & Safe Resolution

> **Editorial Standard Reminder**:
> - Never request personal identifiers (Aadhaar, PAN, OTP, application numbers, bank info).
> - Cite official portals and check dates.
> - Clearly separate general network/browser troubleshooting from portal-specific guidance.

---

## Quick Answer
> **In Short**: A very frequent payment gateway issue where bank funds are deducted from your account, but the government portal has not yet received or reconciled the confirmation webhook from Bharatkosh, SBI ePay, or the aggregator.

---

## Where It Appears
- **Service / Portal**: Passport, Driving Licence, PAN
- **Stage of Application**: Challan / Fee payment confirmation stage
- **Last Verified**: 2026-10-06

---

## Possible Causes
- **Asynchronous batch reconciliation delay between payment aggregator and treasury backend**: Asynchronous batch reconciliation delay between payment aggregator and treasury backend
- **Network drop immediately after entering 3D secure bank OTP before the redirect finished**: Network drop immediately after entering 3D secure bank OTP before the redirect finished
- **Aggregator server timeout during transaction token callback**: Aggregator server timeout during transaction token callback

---

## What to Check Before Retrying (Safe Checks)
- [ ] Verify that funds were genuinely debited from your bank balance / passbook.
- [ ] Check your email and SMS for a Transaction ID (Txn ID) or Bank Reference Number.

---

## Step-by-Step Resolution

### Step 1: Action 1
**DO NOT PAY AGAIN IMMEDIATELY**: Wait at least 24 to 48 business hours for automated reconciliation.

### Step 2: Action 2
Log back into the portal (e.g. Passport Seva or Parivahan) and navigate to 'Payment Status' or 'Verify Payment'.

### Step 3: Action 3
Click the official 'Track Payment Status' or 'Re-verify Payment' button. In over 80% of cases, this pulls the updated bank token and confirms the payment.

### Step 4: Action 4
If status remains pending after 48 hours, raise a ticket on the portal with your Bank Reference Number and Transaction ID.


> [!WARNING]
> **Important Caution**: Making a second payment immediately may result in double deduction. Portals do not guarantee instant refunds for duplicate citizen payments.


---

## Actions to Avoid
- ❌ Do not close your browser tab or hit the back button while the payment gateway is redirecting.

---

## If the Problem Continues (Official Escalation Routes)
- **Official Portal**: [Passport Official Site](https://bharatkosh.gov.in)
- **National Consumer / Portal Helpline**: Bharatkosh Support | Passport Seva 1800-258-1800
- **Grievance Redressal**: [CPGRAMS Portal](https://pgportal.gov.in)

---

## Editorial & Review Metadata
- **Author / Researcher**: Digital India Error Decoder Research Team
- **Last Reviewed Date**: 2026-10-06
- **Feedback & Corrections**: Found an outdated step? Report it via our [Correction Form](/contact/).

> **Disclaimer**: *Digital India Error Decoder is an independent educational initiative and is not affiliated with, endorsed by, or operated by the Government of India or any statutory authority.*
