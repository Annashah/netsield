# netsield
# NetShield

NetShield is a full-stack network intrusion detection dashboard. It combines:

- A Random Forest classifier for identifying benign and attack network flows
- An Isolation Forest for flagging benign-labelled flows that look unusual
- A FastAPI backend for authentication, predictions, history, alerts, reporting, and AI assistance
- A React/Vite dashboard for uploads, live traffic simulation, metrics, alert triage, and PDF/CSV reports

The machine-learning models are trained on CIC-IDS-style CSV network-flow datasets. The repository includes pre-trained model artifacts and a test dataset so the application can be started without immediately retraining.

## Features

### Traffic analysis

- Upload a CIC-IDS CSV file from the dashboard
- Predict the class of each flow with the Random Forest model
- View benign-versus-attack totals and attack-type rankings
- Inspect the most commonly targeted destination ports
- Inspect SYN, ACK, RST, FIN, and PSH TCP flag totals
- Identify benign-labelled flows that appear anomalous through Isolation Forest
- Download an analysis as CSV or PDF

### Live traffic

- Stream sample flows over a WebSocket
- Generate a real-time benign/attack chart
- Create database-backed alerts for attack flows
- Filter and triage alerts as new, acknowledged, or false positive

### Model metrics

- Compare Decision Tree and Random Forest test results
- View accuracy, macro F1, support, precision, recall, and F1 by class
- View the model confusion matrix
- View the top ten Random Forest feature importances

### AI assistant

- Ask questions about the latest uploaded CSV summary
- Request explanations for a specific alert
- Use Groq through an OpenAI-compatible chat-completion client

### Account and history

- Register and log in with a username and password
- Store password hashes and salts in SQLite
- Use bearer tokens for API authentication
- View and delete recent upload history

## Technology stack

| Area | Technology |
|---|---|
| Frontend | React 19, Vite 8, React Router 7, Recharts 3 |
| Backend | Python, FastAPI, Uvicorn |
| Machine learning | scikit-learn, pandas, NumPy, joblib |
| Database | SQLite |
| Reporting | ReportLab |
| AI | Groq SDK |
| Authentication | PBKDF2-HMAC-SHA256, bearer tokens |

## Repository layout

```text
.
|-- backend/
|   |-- ai.py                 # Groq AI assistant integration
|   |-- eda.py                # Basic exploratory data analysis
|   |-- main.py               # FastAPI application and API routes
|   |-- netshield.db          # SQLite users, sessions, history, and alerts
|   |-- report.py             # PDF report generation
|   |-- train.py              # Train the Decision Tree and Random Forest
|   |-- train_iso.py          # Train the benign-traffic Isolation Forest
|   |-- requirements.txt      # Python dependencies
|   `-- models/
|       |-- rf.joblib         # Random Forest and expected feature columns
|       |-- iso.joblib        # Isolation Forest
|       |-- results.json      # Precomputed model evaluation metrics
|       `-- sample.csv        # Flow sample used by the live WebSocket
|-- data/
|   `-- *.pcap_ISCX.csv       # CIC-IDS source datasets
|-- frontend/
|   |-- src/
|   |   |-- App.jsx           # Routes and authentication guard
|   |   |-- api.js            # API base URL and authenticated fetch helper
|   |   |-- Dashboard.jsx     # Upload, charts, history, and live traffic
|   |   |-- Alerts.jsx        # Alert filtering and triage
|   |   |-- AskAI.jsx         # Chat interface
|   |   |-- Metrics.jsx       # Model metrics and confusion matrices
|   |   `-- AuthForm.jsx      # Login and registration
|   |-- package.json
|   `-- vite.config.js
`-- README.md
```

## Prerequisites

Install the following before running the project:

- Python 3.10 or newer
- Node.js 20 or newer
- npm
- A Groq API key only if the AI assistant is needed

