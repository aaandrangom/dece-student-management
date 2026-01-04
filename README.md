# SIGDECE - Integrated DECE Management System

![Wails](https://img.shields.io/badge/Wails-v2-red?style=for-the-badge&logo=wails)
![Go](https://img.shields.io/badge/Go-1.18+-00ADD8?style=for-the-badge&logo=go)
![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react)
![SQLite](https://img.shields.io/badge/SQLite-Local_DB-003B57?style=for-the-badge&logo=sqlite)

**SIGDECE** is a robust and modern desktop application specifically designed for the **Student Counseling Department (DECE)**. Its goal is to optimize the registration, tracking, and management of student records through an intuitive and secure interface that runs 100% locally.

---

## ✨ Key Features

* **Student Record Management:** Creation and detailed tracking of student cases.
* **Modern Frameless Interface:** Custom design with an integrated title bar and institutional colors.
* **Hybrid Architecture:** Combines the native performance of **Go** in the backend with the flexibility of **React** in the frontend.
* **Local Database:** Implemented with **SQLite** to ensure data privacy.
* **Reports:** Generation of documents and follow-up records.

---

## 🛠️ Technologies Used

* **Backend:** Go (Golang)
* **Frontend:** React.js
* **Framework:** Wails v2
* **Database:** SQLite (Gorm / sql)* **Configuration:** Environment variables (.env) for secure credential management

---

## 🚀 Quick Start

### Prerequisites
- Go 1.18+
- Node.js 16+
- Wails v2

### Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd dece-gestion-estudiantil
   ```

2. **Configure environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your credentials
   ```

3. **Install dependencies:**
   ```bash
   go mod download
   cd frontend && npm install
   ```

4. **Run in development:**
   ```bash
   wails dev
   ```

5. **Build for production:**
   ```bash
   wails build
   ```

### 🔒 Security Configuration

**Important:** Before running the application, configure your admin credentials:

1. Copy the example file:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and set secure credentials:
   ```env
   ADMIN_USERNAME=your_username
   ADMIN_PASSWORD=your_secure_password
   ADMIN_FULL_NAME=Your Full Name
   ```

3. **Generate a secure password** (optional):
   - Windows: `.\scripts\generate-password.ps1`
   - Linux/Mac: `./scripts/generate-password.sh`

---