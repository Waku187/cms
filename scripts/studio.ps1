# PowerShell script to run Prisma Studio with default output path
# This works around the issue with custom output paths in Prisma Studio

$schemaPath = "prisma/schema.prisma"
$backupPath = "prisma/schema.prisma.backup"

# Backup original schema
Copy-Item $schemaPath $backupPath

try {
    # Read the schema
    $content = Get-Content $schemaPath -Raw
    
    # Replace the custom output path with a temporary default location
    $content = $content -replace '(\s+output\s+=\s+)"\.\./lib/generated/prisma"', '$1"../node_modules/.prisma/client"'
    
    # Write modified schema
    $content | Set-Content $schemaPath
    
    # Set DATABASE_URL if not already set
    if (-not $env:DATABASE_URL) {
        $env:DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/cmsdb?schema=public"
    }
    
    # Generate Prisma Client with default output
    Write-Host "Generating Prisma Client with default output path..." -ForegroundColor Yellow
    npx prisma generate
    
    # Run Prisma Studio
    Write-Host "Starting Prisma Studio..." -ForegroundColor Green
    npx prisma studio --schema $schemaPath
}
finally {
    # Restore original schema
    if (Test-Path $backupPath) {
        Move-Item $backupPath $schemaPath -Force
        Write-Host "Schema restored to original." -ForegroundColor Green
    }
}

