# PowerShell script to run the customers to owners migration
# This script uses sqlcmd to execute the SQL migration

Write-Host "🔄 Starting customers to owners table migration..." -ForegroundColor Yellow

# Check if sqlcmd is available
try {
    $sqlcmdVersion = sqlcmd -v 2>$null
    Write-Host "✅ sqlcmd found: $sqlcmdVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ sqlcmd not found. Please install SQL Server Command Line Utilities." -ForegroundColor Red
    Write-Host "   Download from: https://docs.microsoft.com/en-us/sql/tools/sqlcmd-utility" -ForegroundColor Yellow
    exit 1
}

# Database connection parameters
$server = "localhost,1433"
$database = "marina_portal"
$username = "sa"
$password = "star"

Write-Host "🔗 Connecting to database: $database on $server" -ForegroundColor Cyan

# Run the migration
try {
    $sqlFile = "scripts\migrate-customers-to-owners.sql"
    
    if (Test-Path $sqlFile) {
        Write-Host "📁 Executing migration script: $sqlFile" -ForegroundColor Cyan
        
        # Execute the SQL script
        sqlcmd -S $server -d $database -U $username -P $password -i $sqlFile -o "migration-output.log"
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Migration completed successfully!" -ForegroundColor Green
            Write-Host "📋 Check migration-output.log for details" -ForegroundColor Cyan
        } else {
            Write-Host "❌ Migration failed with exit code: $LASTEXITCODE" -ForegroundColor Red
            Write-Host "📋 Check migration-output.log for error details" -ForegroundColor Yellow
        }
    } else {
        Write-Host "❌ Migration script not found: $sqlFile" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Error during migration: $_" -ForegroundColor Red
    exit 1
}

Write-Host "🏁 Migration process completed!" -ForegroundColor Green
