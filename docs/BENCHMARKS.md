# Benchmark Results & Analysis

Sentinel v4 uses a **heterogeneous GraphSAGE** scorer across two public return prediction datasets. The graph construction adapts per dataset; the model family stays graph-neural.

---

## Datasets

| Dataset | Source | Graph Construction | Role |
|---|---|---|---|
| **ASOS GraphReturns** | [OSF](https://osf.io/c793h/overview) | Customer → product graph (natural structure) | Main research benchmark |

---

## ASOS GraphReturns Results

ASOS is the primary benchmark — it contains customer-product return interaction data directly aligned with graph-based return prediction.

### Sentinel v4 Performance

| Mode | AUC | PR-AUC | Precision | Recall | F1 | Flag Rate |
|---|---:|---:|---:|---:|---:|---:|
| **Balanced @bestF1** | 0.8218 | 0.8493 | 0.6969 | **0.8789** | 0.7774 | 0.6869 |
| **Aggressive @95R** | 0.8218 | 0.8493 | 0.6380 | **0.9529** | 0.7643 | 0.8135 |

### Comparison with Published Baselines

| System | AUC | Precision | Recall | F1 |
|---|---:|---:|---:|---:|
| **Sentinel Balanced** | 0.8218 | 0.6969 | **0.8789** | 0.7774 |
| **Sentinel Aggressive** | 0.8218 | 0.6380 | **0.9529** | 0.7643 |
| ASOS GNN (McGowan et al.) | — | **0.8160** | 0.7580 | **0.7920** |
| Returnformer (Cao et al.) | **0.8442** | — | 0.8675 | 0.7887 |

### Honest Interpretation

**Where Sentinel wins:**
- **Recall**: 0.8789 balanced (vs ASOS GNN 0.7580, Returnformer 0.8675). Aggressive catches 95.3%.
- **PR-AUC**: 0.8493 — strong precision-recall balance across all thresholds.

**Where Sentinel trails:**
- **AUC**: Returnformer 0.8442 vs Sentinel 0.8218
- **F1**: ASOS GNN 0.7920 vs Sentinel 0.7774
- **Precision**: ASOS GNN 0.8160 vs Sentinel 0.6969 (Sentinel trades precision for higher recall)

### ASOS Cost-Aware Policy Simulation

| Policy | Total Saved (£) | FP Cost (£) | Net Saved (£) | Intervention Rate |
|---|---:|---:|---:|---:|
| Global threshold | £2,506,559 | £703,519 | **£1,803,040** | 82.1% |
| Segment threshold | £2,572,665 | £758,703 | **£1,813,962** | 81.1% |



---

## Comparison with Prior Work

| System | What It Does | Limitation | Sentinel's Gap-Fill |
|---|---|---|---|
| **ASOS GNN** | GNN on customer-product return data | Strong research baseline, not packaged as merchant workflow | Same graph-risk idea + operating modes + merchant thresholds + cost simulation |
| **Returnformer** | Graph Transformer with topological embeddings | Stronger metrics, heavier inference, model-centric | Deployable risk operations: fast score, action policy, copilot explanation, cost-aware decisions |

---

## What To Claim

**Safe:**
- ✅ Graph-neural model family based on customer-product interactions
- ✅ ASOS is the main research benchmark
- ✅ Competitive ASOS recall (0.8789 balanced, 0.9529 aggressive)
- ✅ Product gap: risk score → action policy → cost simulation

**Do not claim:**
- ❌ "We beat SOTA on every metric"
- ❌ "This detects fraudsters"
- ❌ "The model blocks customers automatically"

---

## References

1. McGowan et al., *"A Dataset for Learning Graph Representations to Predict Customer Returns in Fashion Retail"* — [UCL Discovery](https://discovery.ucl.ac.uk/id/eprint/10183628/)
2. Cao et al., *"Returnformer: A Graph Transformer-Based Model for Predicting Product Returns in E-Commerce"* — [MDPI Entropy](https://www.mdpi.com/1099-4300/28/1/72) | [PubMed](https://pubmed.ncbi.nlm.nih.gov/41593979/)
3. ASOS GraphReturns Dataset — [OSF](https://osf.io/c793h/overview)
