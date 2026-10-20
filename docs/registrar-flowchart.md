# Registrar Module — System Flowchart and Description

```mermaid
flowchart TD
    A([Start]) --> B[/Enter email and password/]
    B --> C{Valid credentials?}
    C -- No --> B
    C -- Yes --> D{Account approved by Head Admin?}
    D -- No --> E[Set up profile and wait for approval]
    E --> Z([End])
    D -- Yes --> F[View dashboard]
    F --> G{Choose a task}

    G -- Review applications --> H[Open an application]
    H --> I[Review form and documents]
    I --> J{Requirements complete and valid?}
    J -- No --> K[Return application for correction]
    K --> O[/Applicant is notified/]
    J -- Yes --> L{Approve or reject?}
    L -- Reject --> M[Reject application]
    L -- Approve --> N[Approve and enroll, assign a student number]
    M --> O
    N --> O
    O --> G

    G -- Manage sections --> P[Create sections and assign students]
    P --> G

    G -- Manage student records --> Q[View records and update student status]
    Q --> G

    G -- View history --> R[View activity history]
    R --> G

    G -- Log out --> S[Log out]
    S --> Z([End])
```

---

**Figure 3.1. System Flowchart of the Registrar Module**

The figure above presents the flow of the registrar module of the system developed by the researchers. The process begins when the registrar opens the system and is asked to enter a valid email and password. The system then checks whether the credentials entered are correct. If the credentials are not valid, the registrar is brought back to the login page to try again. If the credentials are valid, the system checks whether the registrar's account has already been approved by the head administrator. If the account is not yet approved, the registrar is first asked to set up a profile and to wait for approval before the system can be used. If the account is already approved, the registrar is directed to the dashboard.

From the dashboard, the registrar is able to choose a task to perform. The main task of the registrar is to review the applications submitted by the applicants. When the registrar opens an application, the system displays the applicant's form together with the uploaded documents, which the registrar reviews one by one. The system then asks whether the requirements are complete and valid. If the requirements are not complete or are not valid, the registrar returns the application for correction, and the applicant is notified so that the needed changes can be made. If the requirements are complete and valid, the registrar proceeds to decide whether to approve or reject the application.

If the registrar chooses to reject the application, the application is marked as rejected. If the registrar chooses to approve the application, the applicant is enrolled and is given a student number. In both cases, the applicant is automatically notified of the decision, and the registrar is brought back to the task selection so that another task may be performed. Aside from reviewing applications, the registrar may also create sections and assign students to them, view the student records and update the status of a student, and view a history of the actions that have already been made.

Finally, when the registrar has finished the needed tasks, the registrar may log out of the system, which ends the process. Through this flow, the proponents made sure that only approved registrars are given access to the system and that every application passes through a clear step of checking before a final decision is reached.
