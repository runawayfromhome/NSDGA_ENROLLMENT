# Online Admission Flowchart

This flowchart describes the applicant flow implemented in `src/components/pages/StudentPortal/Apply.jsx`.

```mermaid
flowchart TD
    A([Applicant opens /StudentPortal/Apply]) --> B[Load enrollment settings, SHS strands, local draft, and current application]
    B --> C{Data ready?}
    C -- No --> D[Show Loading state]
    D --> B
    C -- Yes --> E{Existing application?}

    E -- Yes --> F{Application status is draft?}
    F -- Yes --> G[Restore draft data and uploaded documents]
    G --> H[Resume at Document Submission]
    F -- No --> I{Enrolled or completed?}
    I -- Yes --> J[Redirect to Student Dashboard]
    I -- No --> K[Redirect to Application Status]

    E -- No --> L{Enrollment currently open?}
    L -- No --> M[Show Admission is currently closed]
    M --> N[Link to Student Login for applicants who already applied]
    L -- Yes --> O[Start new application]

    O --> P[Step 1: Account Information\nName, LRN, phone]
    P --> Q{Valid?}
    Q -- No --> P
    Q -- Yes --> R[Step 2: Personal Information\nBirth, address, guardian]
    R --> S{Valid?}
    S -- No --> R
    S -- Yes --> T[Step 3: Grade and Student Type]
    T --> U{Valid?}
    U -- No --> T
    U -- Yes --> V[Step 4: Academic Background]
    V --> W{Valid?}
    W -- No --> V
    W -- Yes --> X[Step 5: Account Creation\nGmail, password, agreements]
    X --> Y{Valid?}
    Y -- No --> X
    Y -- Yes --> Z[Create applicant account and draft application]
    Z --> AA{Account created?}
    AA -- No --> AB[Show account creation error]
    AB --> X
    AA -- Yes --> AC[Sign in and continue]

    H --> AD[Step 6: Document Submission]
    AC --> AD
    AD --> AE[Upload required documents\nJPG, PNG, or PDF up to 5MB]
    AE --> AF{Required documents complete?}
    AF -- No --> AG[Show missing-document error]
    AG --> AE
    AF -- Yes --> AH[Step 7: Review Information]
    AH --> AI{Privacy agreement checked?}
    AI -- No --> AJ[Show privacy agreement error]
    AJ --> AH
    AI -- Yes --> AK[Save draft data]
    AK --> AL{Save successful?}
    AL -- No --> AM[Show save error]
    AM --> AH
    AL -- Yes --> AN[Request six-digit email OTP]
    AN --> AO{OTP request successful?}
    AO -- No --> AP[Show OTP/email error]
    AP --> AH
    AO -- Yes --> AQ[Redirect to /StudentPortal/VerifyOtp]
    AQ --> AR[Applicant verifies OTP]
    AR --> AS[Application becomes submitted]
    AS --> AT([Application Status page])

    B -. Autosave typed data without password .-> AU[(localStorage: nsdga_apply_draft)]
    AU -. Restore on next visit .-> B
```

## Main Actors

- **Applicant:** completes the online admission wizard, uploads documents, and verifies the application by email OTP.
- **Admin:** controls whether online admission is open, the active school year, season dates, and the closed-admission message.
- **Registrar:** reviews submitted applications after OTP verification.

## Important Gate

A new applicant is blocked when `isEnrollmentOpen(enrollment)` returns `false`. An applicant with an existing draft is allowed to resume the draft and continue to document submission even when new admission is closed.
