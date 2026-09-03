# Benchmark Results & Analysis

Sentinel v4 uses a **heterogeneous GraphSAGE** scorer across two public return prediction datasets. The graph construction adapts per dataset; the model family stays graph-neural.

---

## Datasets

| Dataset | Source | Graph Construction | Role |
|---|---|---|---|
| **ASOS GraphReturns** | [OSF](https://osf.io/c793h/overview) | Customer → product graph (natural structure) | Main research benchmark |
| **IBM ReturnPropensity** | [GitHub](https://github.com/IBM/ReturnPropensity) | Order → entity graph (category, brand, ZIP, country, carrier, season, price-band) | Schema-robustness validation |

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

## IBM GNN Results

IBM does not expose customer/product graph IDs. Sentinel converts every order into an **order node** connected to entity nodes (category, brand, ZIP, country, carrier, season, price-band), then trains the same GNN scorer.

### Dataset Details

| Item | Value |
|---|---:|
| Total rows | 152,774 |
| Overall return rate | 15.90% |
| Dev / Val / Test split | 91,664 / 30,555 / 30,555 |
| Split mode | Stratified |
| Device | CPU |

### GNN Model Configuration

| Component | Value |
|---|---:|
| Architecture | `SentinelHeteroGraphSAGE` |
| Entity fields | 14 |
| Entity vocabulary | 37,141 |
| Numeric features | 78 |
| Embedding dimension | 48 |
| Hidden dimension | 128 |
| GNN layers | 2 |

### IBM GNN Metrics

| Mode | AUC | PR-AUC | Precision | Recall | F1 | Flag Rate |
|---|---:|---:|---:|---:|---:|---:|
| **Balanced @bestF1** | 0.8032 | 0.4330 | 0.3750 | 0.6189 | 0.4670 | 0.2623 |
| **Aggressive @95R** | 0.8032 | 0.4330 | 0.2280 | **0.9456** | 0.3674 | 0.6594 |

Segment-threshold run (same GNN score):

| Mode | Precision | Recall | F1 | Flag Rate |
|---|---:|---:|---:|---:|
| Balanced segment | 0.3642 | 0.6296 | 0.4615 | 0.2748 |
| Aggressive segment | 0.2231 | 0.9489 | 0.3613 | 0.6760 |

### Honest Interpretation

- The IBM GNN result is **not SOTA-level**, but it is valid and meaningful
- It proves the graph model runs on a dataset **without explicit customer-product graph IDs**
- Balanced mode touches only ~26.2% of orders
- Aggressive mode catches ~94.6% of returns
- Segment thresholds did not improve F1 — global threshold is the safer selected result

### IBM Policy Simulation

| Merchant Mode | Total Saved (USD) | FP Cost (USD) | Net Saved (USD) | Intervention Rate | a2/a3 Rate |
|---|---:|---:|---:|---:|---:|
| **Balanced** | $578,887 | $119,072 | **$459,815** | 83.1% | 6.3% |
| **Festival aggressive** | $883,076 | $293,432 | **$589,644** | 96.8% | 29.2% |
| **Conservative** | $417,958 | $63,737 | **$354,221** | 55.7% | 1.1% |

---

## Comparison with Prior Work

| System | What It Does | Limitation | Sentinel's Gap-Fill |
|---|---|---|---|
| **IBM ReturnPropensity** | Return-propensity modeling/deployment on IBM stack | Deployment sample; not graph architecture, not cost/action focused | Graph reformulation of order data + GNN scoring + PR metrics + recall modes + FP cost + a0–a3 actions |
| **ASOS GNN** | GNN on customer-product return data | Strong research baseline, not packaged as merchant workflow | Same graph-risk idea + operating modes + merchant thresholds + cost simulation |
| **Returnformer** | Graph Transformer with topological embeddings | Stronger metrics, heavier inference, model-centric | Deployable risk operations: fast score, action policy, copilot explanation, cost-aware decisions |

---

## What To Claim

**Safe:**
- ✅ Same graph-neural model family across both datasets
- ✅ ASOS is the main research benchmark
- ✅ IBM is a schema-robustness validation (order → entity graph)
- ✅ Competitive ASOS recall (0.8789 balanced, 0.9529 aggressive)
- ✅ Product gap: risk score → action policy → cost simulation

**Do not claim:**
- ❌ "We beat SOTA on every metric"
- ❌ "The IBM result beats ASOS GNN"
- ❌ "This detects fraudsters"
- ❌ "The model blocks customers automatically"

---

## References

1. McGowan et al., *"A Dataset for Learning Graph Representations to Predict Customer Returns in Fashion Retail"* — [UCL Discovery](https://discovery.ucl.ac.uk/id/eprint/10183628/)
2. Cao et al., *"Returnformer: A Graph Transformer-Based Model for Predicting Product Returns in E-Commerce"* — [MDPI Entropy](https://www.mdpi.com/1099-4300/28/1/72) | [PubMed](https://pubmed.ncbi.nlm.nih.gov/41593979/)
3. ASOS GraphReturns Dataset — [OSF](https://osf.io/c793h/overview)
4. IBM ReturnPropensity — [GitHub](https://github.com/IBM/ReturnPropensity)
