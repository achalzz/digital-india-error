---
title: "OTP Not Received from Government Website"
slug: "otp-not-received"
id: "ERR-09"
category: "Authentication"
services: ["Aadhaar", "PAN", "Passport"]
search_intent: "OTP not received government website"
last_reviewed: "2026-10-06"
author: "Digital India Error Decoder Research Team"
---

# OTP Not Received from Government Website — Meaning, Causes & Safe Resolution

> **Editorial Standard Reminder**:
> - Never request personal identifiers (Aadhaar, PAN, OTP, application numbers, bank info).
> - Cite official portals and check dates.
> - Clearly separate general network/browser troubleshooting from portal-specific guidance.

---

## Quick Answer
> **In Short**: A common bottleneck caused by telecom gateway congestion, National Do Not Disturb (DND) routing filters, server throttling, or an out-of-sync registered mobile number.

---

## Where It Appears
- **Service / Portal**: Aadhaar, PAN, Passport
- **Stage of Application**: Login, e-Sign, or transaction authentication
- **Last Verified**: 2026-10-06

---

## Possible Causes
- **Telecom operator SMS routing delay during peak working hours (10**: Telecom operator SMS routing delay during peak working hours (10:00 AM – 2:00 PM)
- **Strict DND (Do Not Disturb) settings blocking transactional SMS headers (e.g., VM-UIDAI, AX-GOV)**: Strict DND (Do Not Disturb) settings blocking transactional SMS headers (e.g., VM-UIDAI, AX-GOV)
- **Low mobile network signal or roaming carrier latency**: Low mobile network signal or roaming carrier latency
- **UIDAI rate-limiting**: UIDAI rate-limiting: requesting too many OTPs in rapid succession

---

## What to Check Before Retrying (Safe Checks)
- [ ] Verify your phone has active signal and can receive normal incoming SMS.
- [ ] Check spam/blocked folder in your phone's SMS app.
- [ ] Confirm you are checking the SIM card that is actually linked to the government ID.

---

## Step-by-Step Resolution

### Step 1: Action 1
Wait for the on-screen countdown timer (usually 60–120 seconds) to expire before pressing 'Resend'.

### Step 2: Action 2
Restart your mobile device or toggle Airplane Mode ON/OFF to re-register with the nearest cell tower.

### Step 3: Action 3
If using Aadhaar, try generating a **Time-based OTP (TOTP)** via the official mAadhaar smartphone app (TOTP changes every 30 seconds and does not rely on SMS delivery).

### Step 4: Action 4
Attempt authentication during off-peak hours (before 9:00 AM or after 8:00 PM).


> [!WARNING]
> **Important Caution**: Portal OTPs are typically valid for only 5 to 10 minutes. Entering delayed OTPs after expiration will result in failure.


---

## Actions to Avoid
- ❌ Do not repeatedly click 'Resend OTP' 5+ times; portals will lock your profile for 24 hours.

---

## If the Problem Continues (Official Escalation Routes)
- **Official Portal**: [Aadhaar Official Site](https://uidai.gov.in)
- **National Consumer / Portal Helpline**: UIDAI 1947
- **Grievance Redressal**: [CPGRAMS Portal](https://pgportal.gov.in)

---

## Editorial & Review Metadata
- **Author / Researcher**: Digital India Error Decoder Research Team
- **Last Reviewed Date**: 2026-10-06
- **Feedback & Corrections**: Found an outdated step? Report it via our [Correction Form](/contact/).

> **Disclaimer**: *Digital India Error Decoder is an independent educational initiative and is not affiliated with, endorsed by, or operated by the Government of India or any statutory authority.*
