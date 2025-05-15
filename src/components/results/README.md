# Results Analysis Module

This module allows you to analyze A/B test results in different ways:
- By importing data from A/B testing platforms (AB Tasty, Optimizely, Dynamic Yield)
- By analyzing raw data in CSV format

## Component Structure

- `ResultsAnalysis.tsx`: Main component that orchestrates the different analysis methods
- `ApiImport/ApiTestImport.tsx`: Handles test imports from third-party APIs
- `ApiImport/ABTastyList.tsx`: Specific component for AB Tasty test listing and filtering
- `CsvAnalysis.tsx`: Allows analysis of manually imported CSV data

## Features

### API Import

#### AB Tasty Integration
- Full integration with AB Tasty Core API
- Configuration via application settings
- Multiple properties management (each with its own credentials)
- Test listing with filtering by type and status
- Real-time verification of API credentials

**Configuration:**
- Client ID & Client Secret: OAuth2 authentication credentials
- Account Identifier (Tag ID): 32-character hexadecimal identifier
- Account ID: 5-6 digit numeric identifier for Core API access

**Property Management:**
- Each property represents a different AB Tasty account/project
- Properties are stored in localStorage under 'abtastyConfig'
- Each property contains its own set of credentials and identifiers

#### Other Platforms (Planned)
- Optimizely (coming soon)
- Dynamic Yield (coming soon)

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

- [x] AB Tasty API connectivity implementation
- [ ] Optimizely API connectivity implementation
- [ ] Dynamic Yield API connectivity implementation
- [ ] Statistical analysis of data (significance, confidence interval)
- [ ] Results visualization with charts
- [ ] Export of analyses in PDF/CSV format
- [ ] Support for multivariate analysis
- [ ] Results segmentation 