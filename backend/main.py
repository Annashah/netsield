import io, json, asyncio, sqlite3, secrets, hashlib, joblib, numpy as np, pandas as pd
from dotenv import load_dotenv
from fastapi import FastAPI, UploadFile, WebSocket, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from pydantic import BaseModel
import ai, report

load_dotenv()
art = joblib.load("models/rf.joblib")
model, cols = art["model"], art["columns"]
iso = joblib.load("models/iso.joblib")  # made by train_iso.py
sample = pd.read_csv("models/sample.csv")
last = {}  # latest upload summary per user, used by /report and /ask
db = sqlite3.connect("netshield.db", check_same_thread=False)
db.executescript("""
create table if not exists users(username text primary key, salt text, hash text);
create table if not exists sessions(token text primary key, username text);
create table if not exists history(ts text default current_timestamp, username text, file text, total int, attacks int);
create table if not exists alerts(id integer primary key autoincrement, username text, flow int, label text, status text default 'new', ts text default current_timestamp);""")

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

class Creds(BaseModel):
    username: str
    password: str

def hp(pw, salt): return hashlib.pbkdf2_hmac("sha256", pw.encode(), bytes.fromhex(salt), 100_000).hex()

def user_of(token):
    r = db.execute("select username from sessions where token=?", (token,)).fetchone()
    if not r: raise HTTPException(401, "Not logged in")
    return r[0]

def auth(authorization: str = Header("")): return user_of(authorization.replace("Bearer ", ""))

@app.post("/register")
def register(c: Creds):
    if not c.username.strip() or len(c.password) < 6: raise HTTPException(400, "Username required, password min 6 characters")
    salt = secrets.token_hex(16)
    try: db.execute("insert into users values(?,?,?)", (c.username, salt, hp(c.password, salt)))
    except sqlite3.IntegrityError: raise HTTPException(400, "Username already taken")
    db.commit()
    return {"ok": True}

@app.post("/login")
def login(c: Creds):
    r = db.execute("select salt,hash from users where username=?", (c.username,)).fetchone()
    if not r or not secrets.compare_digest(hp(c.password, r[0]), r[1]): raise HTTPException(401, "Wrong username or password")
    t = secrets.token_hex(24)
    db.execute("insert into sessions values(?,?)", (t, c.username)); db.commit()
    return {"token": t, "username": c.username}

@app.post("/predict")
async def predict(file: UploadFile, user: str = Depends(auth)):
    df = pd.read_csv(io.BytesIO(await file.read()))
    df.columns = df.columns.str.strip()
    if set(cols) - set(df.columns): raise HTTPException(400, "Missing feature columns")
    X = df[cols].replace([np.inf, -np.inf], np.nan).dropna()
    pred = pd.Series(model.predict(X))
    counts = {k: int(v) for k, v in pred.value_counts().items()}
    attacks = sum(v for k, v in counts.items() if k != "BENIGN")
    db.execute("insert into history(username,file,total,attacks) values(?,?,?,?)", (user, file.filename, len(pred), attacks))
    db.commit()

    benign = (pred == "BENIGN").values
    odd = int((iso.predict(X[benign]) == -1).sum()) if benign.any() else 0  # benign-labelled but unlike normal traffic
    D = df.loc[X.index][~benign]  # attack rows, all original columns
    flags = {f: int(D[f"{f} Flag Count"].sum()) for f in ["SYN", "ACK", "RST", "FIN", "PSH"]}
    ports = [[int(p), int(n)] for p, n in D["Destination Port"].value_counts().head(5).items()]
    out = {"counts": counts, "total": len(pred), "odd": odd, "ports": ports, "flags": flags}
    last[user] = {**out, "file": file.filename}
    return {**out, "rows": pred.tolist()[:1000]}

@app.get("/history")
def history(user: str = Depends(auth)):
    return db.execute("select rowid,ts,file,total,attacks from history where username=? order by rowid desc limit 10", (user,)).fetchall()

@app.delete("/history")
def clear_history(rid: int = 0, user: str = Depends(auth)):
    if rid: db.execute("delete from history where rowid=? and username=?", (rid, user))
    else: db.execute("delete from history where username=?", (user,))
    db.commit()
    return {"ok": True}

@app.get("/metrics")
def metrics(user: str = Depends(auth)): return json.load(open("models/results.json"))

@app.get("/importance")
def importance(user: str = Depends(auth)):
    top = sorted(zip(cols, model.feature_importances_), key=lambda t: -t[1])[:10]
    return [[c, float(v)] for c, v in top]

@app.get("/alerts")
def alerts(user: str = Depends(auth)):
    return db.execute("select id,flow,label,status,ts from alerts where username=? order by id desc limit 200", (user,)).fetchall()

@app.post("/alerts/{aid}")
def triage(aid: int, status: str, user: str = Depends(auth)):
    if status not in ("new", "ack", "fp"): raise HTTPException(400, "Bad status")
    db.execute("update alerts set status=? where id=? and username=?", (status, aid, user)); db.commit()
    return {"ok": True}

@app.get("/ask")
def ask(q: str, user: str = Depends(auth)):
    try: return {"answer": ai.ask(q, last.get(user))}
    except Exception as e: raise HTTPException(502, f"AI service error: {e}")

@app.get("/report")
def pdf(user: str = Depends(auth)):
    if user not in last: raise HTTPException(404, "Upload a CSV first")
    return Response(report.build(last[user]), media_type="application/pdf")

@app.websocket("/ws/live")
async def live(ws: WebSocket, token: str = ""):
    try: user = user_of(token)
    except HTTPException: return await ws.close(code=1008)
    await ws.accept()
    try:
        for i in range(len(sample)):
            label = str(model.predict(sample.iloc[[i]][cols])[0])
            if label != "BENIGN":
                db.execute("insert into alerts(username,flow,label) values(?,?,?)", (user, i, label)); db.commit()
            await ws.send_json({"id": i, "label": label})
            await asyncio.sleep(1)
    except Exception: pass
