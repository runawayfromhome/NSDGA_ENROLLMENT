# Online Admission Inputs and Outputs

This document lists the main inputs collected by the online admission flow and the output produced by each step.


# Online Admission Inputs and Outputs

## Admission Period
Input: Admission open/closed setting, season start and end dates
Output: Opens the application form or displays "Admission is currently closed"

## Account Information
Input: First Name, Last Name, Middle Name, Suffix, LRN, Phone Number
Output: Moves to Personal Information

## Personal Information
Input: Sex, Age, Date of Birth, Birthplace, Home Address, Parent/Guardian Details
Output: Moves to Grade and Student Type

## Grade and Student Type
Input: Education Level, Grade Level, Student Type, Preferred Strand (Senior High)
Output: Moves to Academic Background

## Academic Background
Input: Previous School Attended, GWA, School Address, Last Grade Completed
Output: Moves to Account Creation

## Account Creation
Input: Gmail Address, Password, Confirm Password, Terms and Privacy Agreement
Output: Creates applicant account and draft application

## Document Submission
Input: 2x2 Picture, PSA Birth Certificate, Report Card, Good Moral Certificate, Kinder Certificate (Grade 1)
Output: Uploads documents and moves to Review Information

## Review Information
Input: Review all details, Data Privacy Agreement
Output: Saves application and requests email OTP

## OTP Verification
Input: Six-digit verification code sent by email
Output: Application becomes Submitted and opens Application Status

## Applicant Draft
Input: Form details entered before submission
Output: Saves progress locally for up to 12 hours; password is not saved

## Admin Controls
Input: Admission status, active school year, season dates, closed message, SHS strands
Output: Updates the admission form and available options

## Registrar Output
Input: Submitted application and uploaded documents
Output: Reviews the application and updates its status

## Account Information

**Inputs:**

- First Name
- Last Name
- Middle Name, optional
- Suffix, optional
- LRN Number, or `No LRN yet` for eligible incoming Grade 1 applicants
- Phone Number

**Validation outputs:**

- Requires first name and last name
- Requires a 12-digit LRN unless `No LRN yet` is selected
- Accepts Philippine mobile format: `09XXXXXXXXX`
- Removes non-digit characters and limits phone/LRN length

**Successful output:**

- Moves to Personal Information
- Saves the current form data in the local draft

## Personal Information

**Inputs:**

- Sex
- Age, or automatically calculated from Date of Birth
- Date of Birth
- Birthplace
- Region
- Province
- City or Municipality
- Barangay
- House Number and Street
- Father's Name, optional
- Mother's Name, optional
- Guardian's Name, optional
- Guardian's Contact, optional

**Validation outputs:**

- Requires sex, date of birth, and birthplace
- Requires a complete home address
- Validates guardian contact when provided

**Successful output:**

- Moves to Grade and Student Type
- Saves the current form data in the local draft

## Grade and Student Type

**Inputs:**

- Education Level: Elementary, Junior High School, or Senior High School
- Grade Level Applying For
- Student Type: New Student, Transferee, or Returnee
- Preferred Strand when applying for Senior High School

**Validation outputs:**

- Requires education level
- Requires grade level
- Requires a strand for Senior High School applications
- Loads the available Senior High strands from the Admin-managed list

**Successful output:**

- Moves to Academic Background
- Saves the selected grade, student type, and strand in the local draft

## Academic Background

**Inputs:**

- Previous School Attended
- GWA, required except for incoming Grade 1
- School Address
- Last Grade Completed, automatically selected from the applying grade
- Kindergarten School details for incoming Grade 1, when applicable

**Validation outputs:**

- Requires previous school, school address, and last grade for regular applicants
- Requires GWA between 0 and 100 when provided
- Does not require academic records or GWA for incoming Grade 1

**Successful output:**

- Moves to Account Creation
- Saves the academic information in the local draft

## Account Creation

**Inputs:**

- Gmail address
- Password
- Confirm Password
- Agreement to the Terms of Service and Privacy Policy

**Validation outputs:**

- Requires a valid `@gmail.com` address
- Requires a valid student password
- Requires matching password and confirmation
- Requires agreement to the Terms of Service and Privacy Policy

**Successful output:**

- Creates the applicant's Supabase account
- Creates a draft application record
- Signs the applicant in
- Saves all previously entered information to the draft
- Moves to Document Submission

**Failure output:**

- Displays the account creation error
- Keeps the applicant on the Account Creation step

## Document Submission

**Inputs:**

- 2x2 Picture, required
- PSA Birth Certificate, required
- Report Card, required
- Good Moral Certificate, optional
- Kinder Certificate or ECCD Checklist, optional and visible for incoming Grade 1

**File restrictions:**

- JPG, JPEG, PNG, or PDF
- Maximum file size: 5 MB per file

**Upload outputs:**

- Uploads the file to private student storage
- Records the file name, size, path, upload date, and status
- Shows the uploaded file name
- Allows the applicant to replace an uploaded file

**Validation outputs:**

- Prevents unsupported file types
- Prevents files over 5 MB
- Requires all documents marked as required before continuing
- Shows a missing-document error when required files are absent

**Additional output:**

- Form 137 is not uploaded by the applicant because it is transmitted directly from the previous school

## Review Information

**Outputs shown for review:**

- Personal information
- LRN, email, and contact number
- Birth and address information
- Parent or guardian details
- Education level, grade, student type, and strand
- Academic background
- Uploaded document checklist

**Input:**

- Data Privacy Act certification and agreement checkbox

**Validation outputs:**

- Blocks submission until the privacy agreement is checked
- Saves the latest application data before submission

## OTP Request

**Input:**

- Signed-in applicant account

**Successful output:**

- Sends a six-digit verification code to the applicant's email
- Redirects to `/StudentPortal/VerifyOtp`
- Clears the local draft from browser storage

**Failure output:**

- Displays an OTP or email delivery error
- Keeps the applicant on the Review step so they can retry

## OTP Verification

**Input:**

- Six-digit verification code received by email

**Output:**

- Successful verification finalizes the application as Submitted
- Applicant proceeds to the Application Status page
- Registrar can review the submitted application

## Local Draft Autosave

**Inputs saved locally:**

- Current application step
- Applicant form values
- Education level
- Student type
- LRN preference
- Email and phone number
- Application ID when an account exists

**Outputs:**

- Draft data is restored after a refresh or reopened tab
- Password is never stored in the local draft
- Draft expires after 12 hours
- Draft is cleared after successful OTP request

## User Roles and Outputs

### Applicant

- Enters application information
- Uploads documents
- Reviews and submits the application
- Verifies the email OTP
- Views the application status

### Admin

- Opens or closes online admission
- Sets the active school year
- Sets optional season start and end dates
- Edits the closed-admission message
- Manages the available SHS strands

### Registrar

- Receives submitted applications
- Reviews applicant information and documents
- Updates the application status
- Confirms enrollment after review
