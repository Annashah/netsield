"""Run once from backend/:  python train_iso.py "D:\python project\MachineLearningCSV\MachineLearningCVE"
Fits an Isolation Forest on BENIGN flows only and saves models/iso.joblib."""
import sys, glob, joblib, numpy as np, pandas as pd
from sklearn.ensemble import IsolationForest

cols = joblib.load("models/rf.joblib")["columns"]
frames = []
for f in glob.glob(sys.argv[1]):
    df = pd.read_csv(f, encoding="latin1", skipinitialspace=True)
    df.columns = df.columns.str.strip()
    df = df[df["Label"].str.strip() == "BENIGN"][cols].replace([np.inf, -np.inf], np.nan).dropna()
    frames.append(df.sample(min(len(df), 30000), random_state=0))

X = pd.concat(frames)
joblib.dump(IsolationForest(n_estimators=100, contamination=0.01, random_state=0).fit(X), "models/iso.joblib")
print("trained on", len(X), "benign flows")
