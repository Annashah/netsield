import os, json, joblib
import pandas as pd, numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.tree import DecisionTreeClassifier
from sklearn.metrics import classification_report, confusion_matrix

os.makedirs("models", exist_ok=True)
files = ["data/Tuesday-WorkingHours.pcap_ISCX.csv",
         "data/Friday-WorkingHours-Morning.pcap_ISCX.csv",
         "data/Friday-WorkingHours-Afternoon-DDos.pcap_ISCX.csv",
         "data/Friday-WorkingHours-Afternoon-PortScan.pcap_ISCX.csv",
         "data/Thursday-WorkingHours-Morning-WebAttacks.pcap_ISCX.csv"]

files = ["../" + f for f in files]
df = pd.concat(pd.read_csv(f, encoding="latin1") for f in files)
# REMOVED: duplicate pd.concat line without the encoding
df.columns = df.columns.str.strip()
df = df.replace([np.inf, -np.inf], np.nan).dropna().drop_duplicates()
df = df.loc[:, df.nunique() > 1]                      # drop constant columns

y = df["Label"]                                       # CHANGED: attack type, not 0/1
X = df.drop(columns=["Label", "Destination Port"])    # port is a shortcut for these attacks
Xtr, Xte, ytr, yte = train_test_split(X, y, test_size=0.2, stratify=y, random_state=42)

models = {"Decision Tree": DecisionTreeClassifier(max_depth=10, random_state=42),
          "Random Forest": RandomForestClassifier(n_estimators=50, max_depth=15, n_jobs=-1, random_state=42)}
res = {}
for name, m in models.items():
    p = m.fit(Xtr, ytr).predict(Xte)
    res[name] = {"report": classification_report(yte, p, output_dict=True),
                 "cm": confusion_matrix(yte, p).tolist()}

joblib.dump({"model": models["Random Forest"], "columns": list(X.columns)}, "models/rf.joblib", compress=3)
json.dump(res, open("models/results.json", "w"))
df.drop(columns="Destination Port").sample(5000, random_state=42).to_csv("models/sample.csv", index=False)