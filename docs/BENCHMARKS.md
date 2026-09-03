# Benchmark Results & Analysis

This document provides a detailed analysis of Sentinel v4's performance on two public return prediction datasets, along with honest positioning relative to published academic baselines.

---

## Datasets

| Dataset | Source | Rows | Return Rate | Why Used |
|---|---|---|---|---|
| **ASOS GraphReturns** | [OSF Repository](https://osf.io/c793h/overview) | ~100K | ~54% | Main research benchmark — directly aligned with graph-based return prediction |
| **IBM ReturnPropensity** | [GitHub Repository](https://github.com/IBM/ReturnPropensity) | 118,891 | 15.89% | Secondary robustness validation — order-level operational fields |

---

## ASOS GraphReturns Results

ASOS is the primary benchmark because it contains customer-product return interaction data aligned with graph-based return prediction.

### Sentinel v4 Performance

| Mode | AUC | PR-AUC | Precision | Recall | F1 | Flag Rate |
|---|---:|---:|---:|---:|---:|---:|
| **Balanced @bestF1** | 0.8218 | 0.8493 | 0.6969 | **0.8789** | 0.7774 | 0.6869 |
| **Aggressive @95R** | 0.8218 | 0.8493 | 0.6380 | **0.9529** | 0.7643 | 0.8135 |

### Comparison with Published Baselines

| System | AUC | PR-AUC | Precision | Recall | F1 |
|---|---:|---:|---:|---:|---:|
| **Sentinel v4 Balanced** | 0.8218 | 0.8493 | 0.6969 | **0.8789** | 0.7774 |
| **Sentinel v4 Aggressive** | 0.8218 | 0.8493 | 0.6380 | **0.9529** | 0.7643 |
| ASOS GNN (McGowan et al.) | n/a | n/a | **0.8160** | 0.7580 | **0.7920** |
| Returnformer (Cao et al.) | **0.8442** | n/a | n/a | 0.8675 | 0.7887 |

### Honest Interpretation

**Where Sentinel wins:**
- **Recall**: Sentinel Balanced achieves 0.8789 recall — higher than both the ASOS GNN (0.7580) and Returnformer (0.8675). In aggressive mode, it catches 95.3% of returns.
- **PR-AUC**: Sentinel achieves 0.8493 PR-AUC, a strong indicator of precision-recall balance across all thresholds.

**Where Sentinel trails:**
- **AUC**: Returnformer achieves 0.8442 vs Sentinel's 0.8218 — a meaningful gap that reflects the advantage of full graph-transformer attention.
- **F1**: The ASOS GNN achieves 0.7920 F1 vs Sentinel's 0.7774 — a small gap partly due to Sentinel's recall-biased operating point.
- **Precision**: The ASOS GNN achieves 0.8160 precision vs Sentinel's 0.6969 — Sentinel trades some precision for substantially higher recall.

**Safe claims:**
- ✅ "Competitive with graph-based return prediction research"
- ✅ "Beats referenced models on recall in both modes"
- ✅ "More product-complete than paper baselines"

**Avoid claiming:**
- ❌ "SOTA beaten on every metric"
- ❌ "Better than GNNs"

---

## IBM ReturnPropensity Results

IBM is a secondary validation dataset with order-level operational fields (category, carrier, ZIP, country, basket size) rather than customer-product graph IDs.

### Dataset Characteristics

| Split | Rows | Return Rate |
|---|---:|---:|
| Dev | ~70K | 24.77% |
| Validation | ~25K | 4.07% |
| Test | ~24K | **1.09%** |

> **⚠️ Severe target drift**: The test window has very few returns (1.09% vs 24.77% in dev). This creates a distribution-shift stress test where even good models have many false positives.

### Sentinel v4 Performance on IBM

| Mode | AUC | PR-AUC | Precision | Recall | F1 | Flag Rate |
|---|---:|---:|---:|---:|---:|---:|
| **Balanced @bestF1** | **0.9280** | 0.2337 | 0.1581 | 0.6899 | 0.2572 | 0.0474 |
| **Aggressive @95R** | **0.9280** | 0.2337 | 0.0182 | **0.9806** | 0.0357 | 0.5856 |

### Honest Interpretation

**What the IBM result shows:**
- **Strong ranking ability under drift**: AUC of 0.9280 means the model correctly orders risky vs. safe orders even when the return rate drops 23x between training and test.
- **Low balanced intervention**: In balanced mode, only 4.74% of orders are flagged — the model is selective despite the distribution shift.
- **High aggressive recall**: In aggressive mode, 98.06% of returns are caught.

**Why precision/F1 are low:**
- With only ~1.09% of test orders being returns, even a model with moderate false positive rate will show low precision. This is an inherent property of rare-event detection, not a model failure.
- PR-AUC of 0.2337 reflects this class imbalance in the test window.

**Why the IBM result matters:**
- It proves Sentinel can adapt beyond ASOS's customer-product graph signals
- The same product layer (calibrated risk score, reason codes, merchant thresholds, a0/a1/a2/a3 policy) works unchanged
- ASOS version uses customer/product graph signals → IBM version uses order-level business signals

---

## Cost-Aware Policy Simulation (ASOS)

Beyond classification metrics, Sentinel evaluates decisions using business cost:

| Policy | Total Saved | FP Cost | Net Saved | Intervention Rate | a2/a3 Rate |
|---|---:|---:|---:|---:|---:|
| Global threshold | £2,506,559 | £703,519 | **£1,803,040** | 82.09% | 66.70% |
| Segment threshold | £2,572,665 | £758,703 | **£1,813,962** | 81.09% | 66.23% |

This is the core product gap Sentinel fills. A normal ML model outputs "risky" or "not risky." Sentinel estimates:
- How many returns are caught
- How many good customers are disturbed
- How much margin is saved
- How much false-positive friction costs
- Which specific action should be used for each risk band

---

## Comparison with Prior Work

| System | Main Focus | Limitation | Sentinel Improvement |
|---|---|---|---|
| **IBM ReturnPropensity** | Build & deploy a basic return model via Watson ML | Deployment pattern only; no cost-aware merchant actions | PR-AUC, recall modes, calibration, reason codes, FP cost, a0–a3 actions |
| **ASOS GNN** | Graph neural networks on customer-product data | Strong research baseline, not packaged as merchant workflow | Keeps graph-style signals with fast inference + policy simulation |
| **Returnformer** | Graph Transformer with topological embeddings | Computationally heavier, still model-centric | Lightweight scoring, policy controls, risk explanations, cost simulation |

---

## References

1. McGowan et al., *"A Dataset for Learning Graph Representations to Predict Customer Returns in Fashion Retail"* — [UCL Discovery](https://discovery.ucl.ac.uk/id/eprint/10183628/)
2. Cao et al., *"Returnformer: A Graph Transformer-Based Model for Predicting Product Returns in E-Commerce"* — [MDPI Entropy](https://www.mdpi.com/1099-4300/28/1/72) | [PubMed](https://pubmed.ncbi.nlm.nih.gov/41593979/)
3. ASOS GraphReturns Dataset — [OSF](https://osf.io/c793h/overview)
4. IBM ReturnPropensity Repository — [GitHub](https://github.com/IBM/ReturnPropensity)
