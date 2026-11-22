import pandas as pd, numpy as np

files = ["data/Tuesday-WorkingHours.pcap_ISCX.csv",
         "data/Friday-WorkingHours-Morning.pcap_ISCX.csv",
         "data/Friday-WorkingHours-Afternoon-DDos.pcap_ISCX.csv",
         "data/Friday-WorkingHours-Afternoon-PortScan.pcap_ISCX.csv",
         "data/Thursday-WorkingHours-Morning-WebAttacks.pcap_ISCX.csv"]
df = pd.concat(pd.read_csv(f, encoding="latin1") for f in files)
df = pd.concat(pd.read_csv(f) for f in files)
df.columns = df.columns.str.strip()

print("Shape:", df.shape)
print(df["Label"].value_counts())
print("Infinite:", np.isinf(df.select_dtypes("number")).sum().sum())
print("NaN:", df.isna().sum().sum())
print("Duplicates:", df.duplicated().sum())
print("Constant columns:", (df.nunique() <= 1).sum())