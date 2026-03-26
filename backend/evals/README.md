# Eval Samples

Use these fixed cases to compare real output quality after prompt or workflow changes.

Run all cases from `backend/`:

```powershell
.venv\Scripts\python.exe scripts\run_eval_samples.py
```

Run only one case:

```powershell
.venv\Scripts\python.exe scripts\run_eval_samples.py --case cn_gap_sql
```

Reports are written to `backend/evals/results/`.
