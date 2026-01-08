# 📄 DocAI Pro - Intelligent Document Analysis Platform

**DocAI Pro** is a full-stack AI-powered application that transforms static PDF documents into interactive, structured insights. Using **Google Gemini AI**, it analyzes resumes, technical papers, and general documents to extract key entities, generate summaries, and provide confidence scores.

---

## 🚀 Key Features

- **📂 Drag & Drop Upload:** Securely upload PDF documents (up to 10MB) with a clean, responsive UI.
- **🧠 AI-Powered Analysis:** Automatically detects document type (Resume vs. General) and extracts fields like Name, Skills, Dates, and Topics.
- **📊 Smart Dashboard:** A history view with searchable tables, status indicators, and confidence scores.
- **📑 Professional PDF Reports:** Auto-generates a downloadable PDF report of the AI analysis.
- **📱 Fully Responsive:** Works perfectly on Desktop, Tablet, and Mobile with a dynamic sidebar layout.

---

## 🛠️ Tech Stack

### **Frontend**

- **Framework:** React (Vite) + TypeScript
- **Styling:** Tailwind CSS + ShadCN UI
- **Routing:** React Router DOM (v6) with Protected Routes
- **State Management:** React Hooks & Local Storage

### **Backend**

- **Framework:** FastAPI (Python)
- **Database:** SQLite (SQLAlchemy ORM)
- **AI Model:** Google Gemini 1.5 Flash (via Generative AI SDK)
- **PDF Processing:** PyPDF2 & ReportLab
- **Authentication:** JWT (JSON Web Tokens)

---

## ⚙️ How It Works (The 3-Stage Pipeline)

We implemented a robust **Background Task** system to handle heavy AI processing without freezing the UI. Here is exactly what happens when you upload a file:

### **Step 1: Identification & Extraction 🕵️‍♂️**

- The backend accepts the PDF and immediately returns a `processing_id` to the frontend.
- **Background Task:** The system extracts raw text from the PDF pages.
- **Classification:** It intelligently determines if the document is a **Resume** or a **General Document**.
- **Regex Parsing:** Basic details (Email, Phone, Dates) are extracted using regex as a fallback layer.

### **Step 2: AI Summarization & Analysis 🧠**

- The extracted text is sent to **Google Gemini AI**.
- We use a custom-tuned prompt to ask Gemini to:
  1.  Summarize the content in Markdown format.
  2.  Extract key JSON fields (Skills, Experience, key topics).
  3.  Assign a **Confidence Score** (0-100%) based on data clarity.

### **Step 3: Finalization & Report Generation ✅**

- The structured data is saved to the **SQLite Database**.
- The status is updated from `identifying` → `summarizing` → `success`.
- A downloadable **PDF Report** is pre-generated using ReportLab, ready for the user to download instantly from the Results page.

---

## 🚀 Setup Instructions

Follow these steps to run the project locally.

### 1. Clone the Repository

```bash
git clone [https://github.com/Varunanss/DocAI-Pro.git](https://github.com/Varunanss/DocAI-Pro.git)
cd DocAI-Pro
```

### 2. Backend Setup

```bash
cd Backend

# Create Virtual Environment
python -m venv venv
# Activate it (Windows)
.\venv\Scripts\activate
# Activate it (Mac/Linux)
source venv/bin/activate

# Install Dependencies
pip install -r requirements.txt

# Setup Environment Variables
# Create a .env file and add:
# GEMINI_API_KEY=your_api_key_here
# SECRET_KEY=your_jwt_secret

# Run Server
python -m uvicorn app.main:app --reload
```

Backend runs on: http://localhost:8000

### 3. Frontend Setup

```bash
cd Frontend

# Install Dependencies
npm install

# Run Frontend
npm run dev
```

Frontend runs on: http://localhost:8080

## 👨‍💻 Author

**DocAI Pro** was created by **[@Varunanss](https://github.com/Varunanss)**.
