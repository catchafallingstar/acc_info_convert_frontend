# Accessible Infographic Converter (Frontend)

[![Deployed on Vercel](https://img.shields.io/badge/Deploy-Vercel-black?style=flat-square&logo=vercel)](https://acc-info-convert-frontend.vercel.app)
[![Framework](https://img.shields.io/badge/Framework-React_18-blue?style=flat-square&logo=react)](https://react.dev/)
[![Build Tool](https://img.shields.io/badge/Build_Tool-Vite-646CFF?style=flat-square&logo=vite)](https://vitejs.dev/)
[![Accessibility](https://img.shields.io/badge/Accessibility-WCAG_2.1_AA-success?style=flat-square)](https://www.w3.org/WAI/standards-guidelines/wcag/)

An elegant, highly accessible frontend interface designed for the University of Michigan community. This platform allows users to upload complex, inaccessible infographics (like flowcharts, timelines, and comparison charts) and securely convert them into fully accessible, screen-reader-compliant PDF documents.

---

## 🎨 Brand & Design Philosophy
This interface is custom-tailored using the official **University of Michigan (U-M) palette**, focusing deeply on visual comfort and accessibility:
*   **Michigan Blue (`#00274c`)** provides a robust, high-contrast base for all text, titles, and principal interactive controls.
*   **Michigan Maize (`#ffcb05`)** is utilized as an energetic accent for high-importance highlights and focus states, maintaining an AAA-compliant contrast ratio (9.1:1) when paired with dark blue text.
*   **Zero Gray-on-Gray Transitions:** Standard gray borders and text have been replaced with dark slates and steel-blues to guarantee perfect compliance with WCAG contrast requirements.

---

## ♿ Accessibility First (WCAG 2.1 Compliant)
This application was engineered specifically to ensure no user is left behind:
*   **Visible Focus States:** Outlines on critical interactives dynamically transition to thick borders on `tab` navigation so keyboard-only users can easily browse.
*   **Programmatic Labeling:** Fully resolved all form label accessibility challenges. Input tags are mapped to screen-reader-visible labels.
*   **Semantic Elements:** Built using correct semantic HTML5 tags rather than unnested divs, enabling screen readers to map out page hierarchies correctly.

---

## 🛠️ Tech Stack & Structure
*   **Frontend Library:** React 18
*   **Build Engine:** Vite (with HMR)
*   **Styling:** Global CSS via custom-branded CSS tokens
*   **Deployment Hosting:** Vercel

---

## 🚀 How the System Works

The interface handles the user-facing side of a **four-stage processing system**[cite: 1]:

1.  **User Input & Platform Start:** 
    *   The user uploads an infographic image (PNG, JPG, WEBP) or an inaccessible PDF[cite: 1].
    *   The browser safely registers the file and feeds it to the system backend[cite: 1].
2.  **Secure Transit:**
    *   The file is safely dispatched over an encrypted HTTPS connection to our Django service bridge[cite: 1].
3.  **Intelligent PDF Compilation:**
    *   Once processing completes, the platform provides a direct download link to a clean, structured, and accessible PDF document[cite: 1].

---

## 💻 Local Setup & Installation

To run this frontend repository on your local computer, follow these simple steps:

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed on your machine.

### 1. Clone the repository
```bash
git clone [https://github.com/catchafallingstar/acc_info_convert_frontend.git](https://github.com/catchafallingstar/acc_info_convert_frontend.git)
cd acc_info_convert_frontend
```
---
## Backend Repository 
Looking for the Django API backend? Check out the Accessible Infographic Converter Backend Repo.
