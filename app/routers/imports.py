from fastapi import APIRouter, File, UploadFile, HTTPException
import csv
from io import StringIO
from typing import List, Dict, Any

router = APIRouter(prefix="/api/imports", tags=["Data Imports"])

@router.post("/upload/csv", response_model=Dict[str, Any])
async def upload_csv(file: UploadFile = File(...)):
    """
    Upload and process AB test data from CSV file
    """
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="File must be a CSV")
    
    try:
        # Read and validate CSV content
        contents = await file.read()
        text = contents.decode('utf-8')
        csv_reader = csv.DictReader(StringIO(text))
        
        # Convert CSV to list of dictionaries
        data = [row for row in csv_reader]
        
        # Validate required fields
        required_fields = ["test_name", "variation", "visitors", "conversions"]
        if not all(field in csv_reader.fieldnames for field in required_fields):
            raise HTTPException(
                status_code=400, 
                detail=f"CSV must contain the following fields: {', '.join(required_fields)}"
            )
        
        return {
            "success": True,
            "filename": file.filename,
            "row_count": len(data),
            "data": data
        }
    except UnicodeDecodeError:
        raise HTTPException(status_code=400, detail="CSV file must be UTF-8 encoded")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing CSV file: {str(e)}") 