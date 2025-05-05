# Results Analysis Module

This module allows you to analyze A/B test results in different ways:
- By importing data from A/B testing platforms (AB Tasty, Optimizely, Dynamic Yield)
- By analyzing raw data in CSV format

## Component Structure

- `ResultsAnalysis.tsx`: Main component that orchestrates the different analysis methods
- `ApiTestImport.tsx`: Handles test imports from third-party APIs
- `CsvAnalysis.tsx`: Allows analysis of manually imported CSV data

## Features

### API Import

- Connection to APIs of major A/B testing platforms
- Automatic retrieval of test results
- Configuration via application settings

**Current status:** Interface ready, API connectivity to be implemented

### CSV Analysis

- Upload CSV files containing test data
- Drag & drop support
- File format validation

**Expected CSV format:**
```
variant,visits,conversions
control,1000,100
variant_1,1050,120
```

## Future Development

- [ ] API connectivity implementation (AB Tasty, Optimizely, Dynamic Yield)
- [ ] Statistical analysis of data (significance, confidence interval)
- [ ] Results visualization with charts
- [ ] Export of analyses in PDF/CSV format
- [ ] Support for multivariate analysis
- [ ] Results segmentation 