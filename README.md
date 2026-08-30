# Production Directives: Security Assurance & Cloud Run Deployment Suite

A production-grade web application and security workbench engineered according to the **Production Directives**: Agentic Threat Modeling, Secure Coding Standards (OWASP Top 10 + OWASP Top 10 for LLM Applications), Firestore Zero-Insecure-Defaults & RBAC, Zero-Hardcoding Hygiene, AI Security Code Reviewer, E2E Walkthrough Testing, and Automated Cloud Run Deployment.

---

## 1. Architecture & Security Overview

- **Backend Runtime**: Express.js with TypeScript (`tsx` dev / `esbuild` bundled CJS production runtime).
- **AI Integration**: `@google/genai` TypeScript SDK with resilient 4-stage **Model Fallback Ladder**:
  1. Primary: `gemini-3.6-flash`
  2. High-Availability Fallback: `gemini-3.1-flash-lite`
  3. Dynamic Alias: `gemini-flash-latest`
  4. Deep Reasoning Fallback: `gemini-3.7-flash`
- **Security Envelope**:
  - Request deserialization ordering guarantee (JSON body parser mounted before routes).
  - Defensive null-safe payload destructuring and schema validation.
  - Zero-crash undefined-stripping persistence sanitizer.
  - Client and server protection against Indirect Prompt Injection (OWASP LLM01) and Insecure Output Handling (OWASP LLM05).

---

## 2. Prerequisites & Environment Setup

### 2.1 Enable Required Google Cloud APIs

Ensure the necessary Google Cloud services are enabled on your GCP project:

```bash
# Set your GCP Project ID
export PROJECT_ID="YOUR_GCP_PROJECT_ID"
gcloud config set project $PROJECT_ID

# Enable Cloud Run, Secret Manager, and Cloud Firestore APIs
gcloud services enable \
  run.googleapis.com \
  secretmanager.googleapis.com \
  firestore.googleapis.com \
  cloudbuild.googleapis.com \
  artifactregistry.googleapis.com
```

---

## 3. Secret Management Setup (Zero-Hardcoding Hygiene)

Never hardcode credentials or API keys in source code. Use Google Cloud Secret Manager to store and inject `GEMINI_API_KEY` into your Cloud Run runtime service.

### 3.1 Create and Populate the Secret

```bash
# Create the secret definition
gcloud secrets create GEMINI_API_KEY --replication-policy="automatic"

# Populate the secret with your Gemini API Key
echo -n "YOUR_ACTUAL_GEMINI_API_KEY" | gcloud secrets versions add GEMINI_API_KEY --data-file=-
```

### 3.2 Grant Secret Accessor IAM Permission to Cloud Run

Retrieve your GCP Project Number and bind the `roles/secretmanager.secretAccessor` role to the default compute service account:

```bash
# Fetch project number
export PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format="value(projectNumber)")

# Grant secret accessor role
gcloud secrets add-iam-policy-binding GEMINI_API_KEY \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

---

## 4. Firestore Database & Security Rules

Cloud Firestore must be configured with owner-bound access control and zero-insecure defaults.

### 4.1 Security Rules (`firestore.rules`)

Deploy the following security rules to prevent unauthorized reads/writes:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // User isolation: Users can only read and write their own interactions
    match /users/{userId}/interactions/{interactionId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Default deny for all other collections
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

Deploy the rules via Firebase CLI:
```bash
firebase deploy --only firestore:rules
```

---

## 5. Local Development

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env and supply GEMINI_API_KEY

# 3. Start local development server (binds to port 3000)
npm run dev
```

---

## 6. Cloud Run Deployment Flow

Deploy the full-stack container application directly from source:

```bash
# Deploy to Google Cloud Run with Secret Manager environment binding
gcloud run deploy production-directives-suite \
  --source . \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --set-secrets=GEMINI_API_KEY=GEMINI_API_KEY:latest \
  --port 3000
```

---

## 7. Mandatory Campaign Labeling & Verification

Apply the required resource label to register the Cloud Run service for automated challenge verification:

```bash
gcloud run services update production-directives-suite \
  --update-labels=dev-tutorial=cloud-run-ai-challenge \
  --region=us-central1
```

To verify the label has been applied successfully:
```bash
gcloud run services describe production-directives-suite \
  --region=us-central1 \
  --format="value(metadata.labels)"
```
