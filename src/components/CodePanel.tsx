import { useState } from 'react';
import { T } from '../lib/utils';
import { MODELS } from '../data/models';

const SNIPPETS: Record<string, Record<string, string>> ={pytorch:{mlp:`import torch, torch.nn as nn, torch.optim as optim

class MLP(nn.Module):
    def __init__(self, in_d=4, hidden=[128,64,32], out_d=3):
        super().__init__()
        dims   = [in_d] + hidden + [out_d]
        layers = []
        for i in range(len(dims)-1):
            layers.append(nn.Linear(dims[i], dims[i+1]))
            if i < len(dims)-2:
                layers += [nn.BatchNorm1d(dims[i+1]),
                           nn.GELU(), nn.Dropout(0.3)]
        self.net = nn.Sequential(*layers)

    def forward(self, x): return self.net(x)

model     = MLP()
optimizer = optim.AdamW(model.parameters(), lr=1e-3, weight_decay=1e-4)
scheduler = optim.lr_scheduler.OneCycleLR(
                optimizer, max_lr=1e-3, epochs=100,
                steps_per_epoch=len(train_loader))
criterion = nn.CrossEntropyLoss(label_smoothing=0.1)

def train_epoch(model, loader, optimizer, scheduler):
    model.train()
    for X, y in loader:
        optimizer.zero_grad()
        loss = criterion(model(X), y)
        loss.backward()
        nn.utils.clip_grad_norm_(model.parameters(), 1.0)
        optimizer.step(); scheduler.step()`,transformer:`class TransformerCLS(nn.Module):
    def __init__(self, vocab=30000, d=256, heads=8,
                 n_layers=6, out=2, max_len=512, dropout=0.1):
        super().__init__()
        self.embed    = nn.Embedding(vocab, d, padding_idx=0)
        self.pos      = nn.Embedding(max_len, d)
        self.drop     = nn.Dropout(dropout)
        enc_layer     = nn.TransformerEncoderLayer(
            d_model=d, nhead=heads,
            dim_feedforward=d*4, dropout=dropout,
            batch_first=True, norm_first=True,  # pre-norm
            activation='gelu')
        self.enc      = nn.TransformerEncoder(enc_layer, n_layers,
                            norm=nn.LayerNorm(d))
        self.head     = nn.Linear(d, out)

    def forward(self, x, mask=None):
        B, L   = x.shape
        pos    = torch.arange(L, device=x.device).unsqueeze(0)
        h      = self.drop(self.embed(x) + self.pos(pos))
        h      = self.enc(h, src_key_padding_mask=mask)
        return self.head(h[:, 0])   # [CLS] token`,vae:`class VAE(nn.Module):
    def __init__(self, input_dim=784, h=512, z=64):
        super().__init__()
        self.enc  = nn.Sequential(
            nn.Linear(input_dim, h), nn.GELU(),
            nn.Linear(h, h//2),     nn.GELU())
        self.mu   = nn.Linear(h//2, z)
        self.logv = nn.Linear(h//2, z)
        self.dec  = nn.Sequential(
            nn.Linear(z, h//2),     nn.GELU(),
            nn.Linear(h//2, h),     nn.GELU(),
            nn.Linear(h, input_dim),nn.Sigmoid())

    def reparameterize(self, mu, lv):
        std = (0.5*lv).exp()
        return mu + std * torch.randn_like(std)

    def forward(self, x):
        h       = self.enc(x.view(-1, 784))
        mu, lv  = self.mu(h), self.logv(h)
        z       = self.reparameterize(mu, lv)
        recon   = self.dec(z)
        kld     = -0.5 * (1 + lv - mu**2 - lv.exp()).sum(1).mean()
        bce     = F.binary_cross_entropy(recon,
                                         x.view(-1,784), reduction='mean')
        return recon, bce + kld`},sklearn:{dtree:`from sklearn.tree import DecisionTreeClassifier, export_text
from sklearn.metrics import classification_report

model = DecisionTreeClassifier(
    max_depth=5, min_samples_split=10,
    min_samples_leaf=5, criterion='gini',
    class_weight='balanced', random_state=42)

model.fit(X_train, y_train)
y_pred = model.predict(X_test)
print(classification_report(y_test, y_pred))
print(export_text(model, feature_names=feat_names, max_depth=3))`,rf:`from sklearn.ensemble import RandomForestClassifier
from sklearn.inspection import permutation_importance

model = RandomForestClassifier(
    n_estimators=500, max_features='sqrt',
    min_samples_leaf=4, oob_score=True,
    n_jobs=-1, random_state=42)
model.fit(X_train, y_train)
print(f"OOB: {model.oob_score_:.4f}")
pi = permutation_importance(model, X_val, y_val, n_repeats=10)
top5 = feature_names[pi.importances_mean.argsort()[::-1][:5]]
print("Top features:", top5)`,xgb:`import xgboost as xgb
from sklearn.metrics import log_loss, accuracy_score

dtrain = xgb.DMatrix(X_train, label=y_train)
dval   = xgb.DMatrix(X_val,   label=y_val)
params = {
    'max_depth': 6, 'eta': 0.05,
    'subsample': 0.8, 'colsample_bytree': 0.8,
    'gamma': 0.1, 'lambda': 1.0, 'alpha': 0.1,
    'objective': 'multi:softprob',
    'num_class': 3, 'eval_metric': 'mlogloss',
    'tree_method': 'hist', 'seed': 42,
}
model = xgb.train(params, dtrain, num_boost_round=1000,
    evals=[(dtrain,'train'),(dval,'val')],
    early_stopping_rounds=30, verbose_eval=100)`,kmeans:`from sklearn.cluster   import KMeans
from sklearn.preprocessing import StandardScaler
from sklearn.metrics       import silhouette_score, davies_bouldin_score

X_s = StandardScaler().fit_transform(X)
k_range = range(2, 12)
scores  = []
for k in k_range:
    m = KMeans(k, n_init=10, random_state=42).fit(X_s)
    scores.append({'k':k,'inertia':m.inertia_,
                   'silhouette':silhouette_score(X_s, m.labels_)})

best_k = max(scores, key=lambda s: s['silhouette'])['k']
model  = KMeans(n_clusters=best_k, init='k-means++',
                n_init=20, max_iter=500, random_state=42)
labels = model.fit_predict(X_s)
print(f"k={best_k} | Sil={silhouette_score(X_s,labels):.4f} "
      f"| DB={davies_bouldin_score(X_s,labels):.4f}")`}};

function getCode(key: string,fw: string){
  const pool=SNIPPETS[fw]||SNIPPETS.sklearn;
  return pool[key]||pool[Object.keys(pool)[0]]||`# ${key} (${fw})\n# Add your code here\nmodel = build_${key}_model()\nmodel.fit(X_train, y_train)`;
}

interface CodePanelProps {
  modelKey: string;
  framework: string;
  selLayer: number | null;
}

export function CodePanel({modelKey, framework, selLayer}: CodePanelProps){
  const [mode,setMode]=useState('generated');
  const [custom,setCustom]=useState('');
  const [flash,setFlash]=useState('');
  const generated=getCode(modelKey,framework);
  const code=mode==='custom'&&custom?custom:generated;
  const msg=(m:string)=>{setFlash(m);setTimeout(()=>setFlash(''),2200);};
  const paste=async()=>{try{const t=await navigator.clipboard.readText();setCustom(t);setMode('custom');msg('✓ Pasted from clipboard');}catch{alert('Allow clipboard access in browser settings.');}};
  const copy=async()=>{await navigator.clipboard.writeText(code);msg('✓ Copied to clipboard');};
  const dl=()=>{const b=new Blob([code],{type:'text/plain'});const u=URL.createObjectURL(b);const a=document.createElement('a');a.href=u;a.download=`${modelKey}_${framework}.py`;a.click();URL.revokeObjectURL(u);msg('✓ Downloaded');};
  const reset=()=>{setCustom('');setMode('generated');msg('↺ Restored generated');};
  interface ABProps {
    icon: string;
    lbl: string;
    fn: () => void;
    col?: string;
  }
  const AB=({icon,lbl,fn,col=T.indigo}: ABProps)=>(
    <button onClick={fn} style={{display:'flex',alignItems:'center',gap:4,padding:'5px 10px',borderRadius:6,fontSize:10.5,fontWeight:500,background:col+'18',color:col,border:`1px solid ${col}33`,cursor:'pointer',fontFamily:'inherit',transition:'all .12s',whiteSpace:'nowrap'}}>{icon} {lbl}</button>
  );

  const getLineHighlight = (line: string) => {
    if (selLayer === null) return false;
    const model = MODELS.find(m => m.key === modelKey);
    if (!model || !model.layers || !model.layers[selLayer]) return false;
    
    const layerType = model.layers[selLayer].t;
    // Map layer types to code keywords
    const kwMap: Record<string, string[]> = {
      'Linear': ['nn.Linear', 'Dense', 'layers.append'],
      'Input': ['in_d', 'input_dim', 'Input'],
      'Conv2D': ['nn.Conv', 'Conv2D', 'Conv'],
      'MaxPool2D': ['nn.MaxPool2d', 'MaxPooling2D', 'MaxPool'],
      'Attention': ['Transformer', 'MultiHeadAttention', 'self.enc'],
      'Embedding': ['nn.Embedding'],
      'Output': ['out_d', 'out_features', 'num_classes', 'head'],
      'Decision Node': ['DecisionTreeClassifier'],
      'Tree Ensemble': ['RandomForestClassifier', 'xgb.train'],
      'Centroids': ['KMeans'],
      'Encoder': ['self.enc', 'Linear'],
      'Decoder': ['self.dec', 'Linear'],
      'Bottleneck (Z)': ['self.mu', 'self.logv', 'reparameterize']
    };
    
    const kws = kwMap[layerType];
    if (kws && kws.some(k => line.includes(k))) return true;

    return false;
  };

  return(
    <div style={{display:'flex',flexDirection:'column',height:'100%',gap:8}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:6}}>
        <div style={{display:'flex',gap:3}}>
          {['generated','custom'].map(m=><button key={m} onClick={()=>setMode(m)} style={{padding:'4px 10px',borderRadius:6,fontSize:10.5,fontWeight:500,background:mode===m?T.indigo:T.surf2,color:mode===m?'#fff':T.muted,border:`1px solid ${mode===m?T.indigo:T.border}`,cursor:'pointer',fontFamily:'inherit'}}>{m==='generated'?'⚡ Generated':'✏️ Custom'}</button>)}
        </div>
        <div style={{display:'flex',gap:4,alignItems:'center',flexWrap:'wrap'}}>
          {flash&&<span style={{fontSize:10,color:T.green,fontWeight:700}}>{flash}</span>}
          <AB icon="⬇" lbl="Paste" fn={paste} col={T.violet}/>
          <AB icon="⎘" lbl="Copy" fn={copy}/>
          <AB icon="↓" lbl=".py" fn={dl} col={T.sky}/>
          {custom&&<AB icon="↺" lbl="" fn={reset} col={T.muted}/>}
        </div>
      </div>
      {mode==='custom'&&custom&&(
        <div style={{padding:'6px 10px',background:T.orangeL,borderRadius:7,border:`1px solid ${T.orange}33`,fontSize:10.5,color:T.orange,display:'flex',gap:6}}>
          <span>✏️</span> Custom code active — switch to Generated to restore defaults.
        </div>
      )}
      <div style={{flex:1,position:'relative',minHeight:250}}>
        <div style={{position:'absolute',top:10,right:12,fontSize:9,color:'rgba(40,80,160,.45)',fontFamily:'JetBrains Mono',pointerEvents:'none',zIndex:1}}>{framework} · {modelKey}</div>
        {mode === 'custom' ? (
          <textarea value={code} onChange={e=>{setCustom(e.target.value);setMode('custom');}} spellCheck={false}
            style={{width:'100%',height:'100%',padding:'14px',fontFamily:'"JetBrains Mono",monospace',fontSize:11.5,lineHeight:1.85,background:T.canvasBg,color:T.text,border:`1px solid ${T.border}`,borderRadius:8,resize:'none',outline:'none',boxSizing:'border-box',tabSize:4}}/>
        ) : (
          <div style={{width:'100%',height:'100%',padding:'14px 0',fontFamily:'"JetBrains Mono",monospace',fontSize:11.5,lineHeight:1.85,background:T.canvasBg,color:T.text,border:`1px solid ${T.border}`,borderRadius:8,overflow:'auto',boxSizing:'border-box',tabSize:4}}>
            {code.split('\n').map((line, i) => {
              const hl = getLineHighlight(line);
              return (
                <div key={i} style={{
                  padding: '0 14px',
                  background: hl ? 'rgba(79, 70, 229, 0.25)' : 'transparent',
                  borderLeft: hl ? `3px solid ${T.indigo}` : '3px solid transparent',
                  transition: 'all 0.2s',
                  whiteSpace: 'pre-wrap'
                }}>
                  {line || ' '}
                </div>
              );
            })}
          </div>
        )}
      </div>
      <div style={{fontSize:9,color:T.subtle,textAlign:'right',fontFamily:'JetBrains Mono'}}>{code.split('\n').length} lines · {code.length} chars · {framework}</div>
    </div>
  );
}

