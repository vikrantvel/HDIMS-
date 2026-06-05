# HDIMS (Healthcare Disease Intelligence & Monitoring System)



**HDIMS** is a modern, full-stack web application designed for healthcare networks, epidemiologists, and public health officials to log, analyze, and visualize disease outbreak vectors in real-time.

By converting patient records into geospatially mapped hotspots and interactive statistical widgets, HDIMS bridges the gap between raw data entry and actionable public health intelligence.

---

## 🌟 Vision & Goal

The vision of HDIMS is to drive **proactive and data-driven outbreak response**. Instead of reacting to epidemics after they overwhelm medical infrastructure, HDIMS provides live regional situational awareness—enabling proactive resource allocation (staff, beds, vaccines) and localized disease containment.

---

## 📸 UI & Features Walkthrough

### 🔒 Gateway & Authentication

HDIMS features an adaptive entry portal supporting passwordless staff access and secure credential verification for system administrators, complete with a terminal-style system initialization sequence.

| Staff / Public Gateway | Secure Admin Login |
| --- | --- |
|  |  |

<img width="1600" height="1041" alt="1" src="https://github.com/user-attachments/assets/8f7ecaa2-1e0d-4bc2-b35b-f3cbd3e199fc" />
<img width="1600" height="1041" alt="2" src="https://github.com/user-attachments/assets/e4a196d6-9063-4f6c-b163-0e84cf357669" />


| ⚙️ Gateway Protocol Initialization |
| --- |
|  |

<img width="1600" height="1041" alt="3" src="https://github.com/user-attachments/assets/e054d4e8-6572-4036-a142-4a012e5e9d9e" />

---

### 📊 Executive Analytics Dashboard

The central command center offers real-time telemetry metrics alongside dynamic categorical bar charts and multi-line regional transmission trackers.

| Analytics Command Center |
| --- |
|  |

<img width="1600" height="1041" alt="4" src="https://github.com/user-attachments/assets/46282114-85e3-48f2-8c44-05e68392a0e6" />

---

### 🗺️ Dual-Mode Geospatial Heatmapping

Toggle fluidly between a high-performance WebGL 3D globe for global outbreak vectors and an ambient 2D Leaflet dark/light layer for localized transmission cluster visualizations.

| 🌐 3D WebGL Globe View (Dark Theme + Light Theme) | ☀️ 3D WebGL Globe View (Light Theme) |
| --- | --- |
|  |  |

<img width="1600" height="1041" alt="5" src="https://github.com/user-attachments/assets/67fc4ba4-c434-4ac9-8e18-8d3a6947069b" />
<img width="1600" height="1041" alt="6" src="https://github.com/user-attachments/assets/9a402e0f-2c0e-45c5-88f2-49cae3ed3fd4" />

| 📍 2D Leaflet Projection Mapping (Dark Theme + Light Theme) |
| --- |
|  |

<img width="1470" height="956" alt="11" src="https://github.com/user-attachments/assets/8a0f6a1d-e226-47d8-80e3-6cc47d69a3c6" />

<img width="1600" height="1041" alt="7" src="https://github.com/user-attachments/assets/e177c685-7b07-48a7-884c-700e90e234e2" />

---

### 📋 Patient Management & Governance

Streamline clinical workflows with voice-dictation-assisted patient intake forms, interactive searchable data registries, and multi-role administrative permission toggles.

| 🎙️ Audio-Assisted Patient Intake | 🔍 Indexed Patient Registry |
| --- | --- |
|  |  |

<img width="1600" height="1041" alt="8" src="https://github.com/user-attachments/assets/6c0319cb-83ce-4109-b6cb-9009701d1c52" />

<img width="1600" height="1041" alt="9" src="https://github.com/user-attachments/assets/88d09f2d-303e-4834-b3c5-ce55152e3c8f" />



| 👥 Enterprise Role-Based Access Control (RBAC) |
| --- |
|  |

<img width="1600" height="1041" alt="10" src="https://github.com/user-attachments/assets/9552c570-36ba-4b7b-ac33-ac6f7f0ca98e" />





---

## 🚀 Key Features

### 1. Dual-Mode Geospatial Map (3D Globe & 2D Projection)

* **3D Rotating Globe (`globe.gl` + Three.js/WebGL)**: Displays active disease vectors as pulsing 3D coordinates. The colors reflect case severity. Hovering expands telemetry, and clicking locks the camera view onto that city/hotspot.


* **2D Flat Map (React-Leaflet)**: Renders a traditional map layer with custom circular overlays representing transmission zones. Supports Dark/Light map themes.


* **Heads-Up Display (HUD) Telemetry**: A left-hand sliding dashboard drawer for filtering maps by specific diseases and reading coordinates/metadata for focused cases.



### 2. Analytical Dashboard (Recharts)

* **High-Level Statistics**: Total Patient Count, Active Cases, Recovery Rate, and Unique Diseases.


* **Disease Distribution Chart**: A dynamic bar chart mapping case loads across different disease classifications.


* **Regional Outbreak Tracker**: A multi-line chart graphing total, active, and recovered cases across geographic sectors (North, South, East, West, Central).



### 3. Case & Patient Management (CRUD)

* Secure logging of patient demographics (name, age), disease type, severity (`Mild`, `Moderate`, `Severe`, `Critical`), recovery status (`Active`, `Recovered`, `Deceased`), and latitude/longitude coordinates.



### 4. Role-Based Access Control (RBAC)

* Access levels divided into **Staff** (view-only analytics and heatmap), **Admin** (modify patient/disease data), and **Super Admin** (full system settings and user management) using JSON Web Tokens (JWT).



### 5. Automated Outbreak Alerter

* Continually checks active case levels. If cases cross the preset threshold limit (e.g. 10 cases), a system-wide alert is triggered to warn coordinators.



---

## 🛠️ Technology Stack

* **Frontend**: React (Vite), Tailwind CSS v4, Leaflet, Globe.gl, Recharts, Lucide Icons, Axios, React Router Dom


* **Backend**: Node.js, Express, Mongoose ODM


* **Database**: MongoDB (includes a portable, zero-config `MongoMemoryServer` fallback)



---

## ⚙️ Quick Start Guide

### Prerequisites

Make sure you have [Node.js](https://nodejs.org/) installed.

### 1. Backend Setup

1. Navigate to the backend directory:


```bash
cd backend

```



```
2. Install dependencies:[cite: 1]
   ```bash
   npm install

```

3. Start the server:


```bash
npm start

```



```
   *Note: If no external MongoDB URI is set in `.env`, the backend spins up an in-memory database and auto-seeds it with 12 mock patients and 3 admin/staff accounts.*[cite: 1]

### 2. Frontend Setup
1. Open a new terminal tab and navigate to the frontend directory:[cite: 1]
   ```bash
cd frontend

```

2. Install dependencies:


```bash

```



npm install

```
3. Run the development server:[cite: 1]
   ```bash
npm run dev

```

4. Open your browser and navigate to `http://localhost:3000`.



---

## 🔑 Test Credentials

The database auto-seeds with these accounts for testing roles:

| Role | Email | Password | Access Level |
| --- | --- | --- | --- |
| **Super Admin** | `super@hdims.com` | `password123` | Full user control + patient management |
| **Admin** | `admin@hdims.com` | `password123` | Can view dashboard and edit patient records |
| **Staff** | `user@hdims.com` | `password123` | View-only dashboard and outbreak heatmap |

---
