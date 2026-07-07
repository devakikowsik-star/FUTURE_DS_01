# Future Interns: Data Science & Analytics Projects (2026)

Welcome to my portfolio repository for the **Future Interns Data Science & Analytics Internship (2026)**. This repository contains the analytics pipelines, data cleaning modules, and interactive dashboards developed to resolve real-world business intelligence problems.

---

## 📂 Repository Contents

This repository is divided into two distinct, standalone projects:

### 1. [Task 1: Business Sales Performance Analytics](./Task%201%20-%20Business%20Sales%20Analytics/)
* **Objective**: Clean messy retail transaction logs and analyze product, regional, and monthly sales performance.
* **Key Visualizations**: Monthly revenue trends, category distributions, product leaders, and regional profit comparisons.
* **Core Deliverables**:
  * Python pipeline: [clean_data.py](./Task%201%20-%20Business%20Sales%20Analytics/data/clean_data.py)
  * Interactive Sales Dashboard: [index.html](./Task%201%20-%20Business%20Sales%20Analytics/dashboard/index.html)
  * Strategic business recommendations report.
* **Explore Task 1**: See the [Task 1 README](./Task%201%20-%20Business%20Sales%20Analytics/README.md) for full audit reports and insights.

### 2. [Task 2: Customer Retention & Churn Analysis](./Task%202%20-%20Customer%20Churn%20Analytics/)
* **Objective**: Analyze customer subscription behaviors, identify cohorts at risk of churning, and design actionable retention playbooks.
* **Key Visualizations**: Customer cohort survival curve, contract type churn rates, dominant cancellation reasons, and plan type vulnerability.
* **Core Deliverables**:
  * Python pipeline: [clean_churn_data.py](./Task%202%20-%20Customer%20Churn%20Analytics/data/clean_churn_data.py)
  * Interactive SaaS Churn Dashboard: [index.html](./Task%202%20-%20Customer%20Churn%20Analytics/dashboard/index.html)
  * Specific, high-impact marketing and onboarding retention playbooks.
* **Explore Task 2**: See the [Task 2 README](./Task%202%20-%20Customer%20Churn%20Analytics/README.md) for survival rates and tactical playbooks.

---

## 💻 Tech Stack & Design Aesthetics

Both applications are engineered using:
* **Python**: Used as the data science engine to run de-duplication, date format normalizations, and group-level pricing imputations.
* **Vanilla HTML5 & CSS3**: Styled with custom Outfit & Inter typography, responsive layouts, and modern dark-themed glassmorphism.
* **JavaScript & Chart.js**: Handles interactive client-side calculations, filter state updates, responsive charts, and CSV data exports.

---

## 🚀 How to Run the Dashboards Locally

Each project is designed with **zero-CORS restrictions**, meaning you can run the dashboards without any local server configuration:
1. Navigate to the project dashboard folder (e.g., [Task 1 Dashboard](./Task%201%20-%20Business%20Sales%20Analytics/dashboard/) or [Task 2 Dashboard](./Task%202%20-%20Customer%20Churn%20Analytics/dashboard/)).
2. Double-click the `index.html` file to launch it directly in your web browser.
3. Use top filters to query regional or plan-specific details.
4. Click **Print Summary** to export a PDF, or **Export CSV** to download the clean data.
