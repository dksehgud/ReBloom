param(
    [int]$DbMaxConnections = 40,
    [int]$BeforePods = 3,
    [int]$BeforePoolSize = 20,
    [int]$AfterPods = 3,
    [int]$AfterPoolSize = 8,
    [int]$HoldSeconds = 6
)

$ErrorActionPreference = "Stop"

$containerName = "rebloom-connection-pool-bench"
$postgresImage = "postgres:16-alpine"
$postgresPassword = "rebloom-bench"
$dbName = "rebloom_pool_bench"
$appUser = "rebloom_app"
$appPassword = "rebloom-app"
$root = Resolve-Path (Join-Path $PSScriptRoot "..\..\..")
$captureDir = Join-Path $root "docs\portfolio-captures\db-connection-pool"
$rawDir = Join-Path $captureDir "raw"
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$outputFile = Join-Path $rawDir "db-connection-pool-benchmark-output-$timestamp.txt"
$latestFile = Join-Path $rawDir "db-connection-pool-benchmark-output-latest.txt"

New-Item -ItemType Directory -Force -Path $rawDir | Out-Null

function Write-Line {
    param([string]$Message = "")
    Add-Content -Path $outputFile -Value $Message
    Write-Host $Message
}

function Invoke-Postgres {
    param([string]$Sql)

    docker exec -e PGPASSWORD=$postgresPassword $containerName `
        psql -U postgres -d $dbName -qAt -v ON_ERROR_STOP=1 -c $Sql
}

function Remove-BenchmarkContainer {
    $existingContainerId = docker ps -aq --filter "name=^/$containerName$"
    if (-not [string]::IsNullOrWhiteSpace($existingContainerId)) {
        docker rm -f $containerName | Out-Null
    }
}

function Wait-ForPostgres {
    for ($i = 1; $i -le 30; $i++) {
        docker exec -e PGPASSWORD=$postgresPassword $containerName `
            pg_isready -U postgres -d $dbName | Out-Null

        if ($LASTEXITCODE -eq 0) {
            return
        }

        Start-Sleep -Seconds 1
    }

    throw "PostgreSQL did not become ready in time."
}

function Invoke-ConnectionScenario {
    param(
        [string]$Name,
        [int]$Pods,
        [int]$PoolSize
    )

    $totalConnections = $Pods * $PoolSize
    Write-Line ""
    Write-Line "## $Name"
    Write-Line "- pods: $Pods"
    Write-Line "- pool_size_per_pod: $PoolSize"
    Write-Line "- attempted_connections: $totalConnections"
    Write-Line "- hold_seconds_per_connection: $HoldSeconds"

    $workDir = "/tmp/rebloom_pool_bench_$($Name -replace '[^a-zA-Z0-9_]', '_')"
    $scenarioScript = @"
set -eu
rm -rf "$workDir"
mkdir -p "$workDir"
(
  while [ ! -f "$workDir/stop-sampler" ]; do
    PGPASSWORD='$postgresPassword' psql -U postgres -d '$dbName' -qAt -c "SELECT count(*) FROM pg_stat_activity WHERE usename = '$appUser' AND state = 'active';" >> "$workDir/active_samples.txt" 2>/dev/null || true
    sleep 0.2
  done
) &
sampler_pid=`$!
pids=""
i=1
while [ `$i -le $totalConnections ]; do
  (
    set +e
    PGPASSWORD='$appPassword' psql -U '$appUser' -d '$dbName' -qAt -v ON_ERROR_STOP=1 -c "SELECT pg_sleep($HoldSeconds);" > "$workDir/out_`$i.txt" 2>&1
    echo `$? > "$workDir/code_`$i.txt"
  ) &
  pids="`$pids `$!"
  i=`$((i + 1))
done
for pid in `$pids; do
  wait `$pid || true
done
touch "$workDir/stop-sampler"
wait `$sampler_pid 2>/dev/null || true
"@

    $sw = [System.Diagnostics.Stopwatch]::StartNew()
    $scenarioScript | docker exec -i $containerName sh
    if ($LASTEXITCODE -ne 0) {
        throw "Scenario '$Name' failed to run."
    }
    $sw.Stop()

    $codesText = docker exec $containerName sh -c "cat $workDir/code_*.txt 2>/dev/null || true"
    $codes = @($codesText -split "`n" | Where-Object { $_ -match "^\d+$" })
    $successCount = @($codes | Where-Object { $_ -eq "0" }).Count
    $failureCount = @($codes | Where-Object { $_ -ne "0" }).Count
    $failureRate = if ($totalConnections -eq 0) { 0 } else { [Math]::Round(($failureCount / $totalConnections) * 100, 1) }
    $maxActiveText = docker exec $containerName sh -c "sort -nr $workDir/active_samples.txt 2>/dev/null | head -1"
    $maxActive = if ([string]::IsNullOrWhiteSpace($maxActiveText)) { 0 } else { [int]$maxActiveText.Trim() }
    $scenarioWallTimeMs = [Math]::Round($sw.Elapsed.TotalMilliseconds, 0)

    Write-Line "- successful_connections: $successCount"
    Write-Line "- failed_connections: $failureCount"
    Write-Line "- failure_rate_percent: $failureRate"
    Write-Line "- max_observed_active_db_connections: $maxActive"
    Write-Line "- scenario_wall_time_ms: $scenarioWallTimeMs"

    return [pscustomobject]@{
        Name = $Name
        Pods = $Pods
        PoolSize = $PoolSize
        AttemptedConnections = $totalConnections
        SuccessfulConnections = $successCount
        FailedConnections = $failureCount
        FailureRatePercent = $failureRate
        MaxObservedActiveDbConnections = $maxActive
        ScenarioWallTimeMs = $scenarioWallTimeMs
    }
}

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    throw "Docker CLI was not found."
}

docker info | Out-Null
if ($LASTEXITCODE -ne 0) {
    throw "Docker is not running."
}

if (Test-Path $outputFile) {
    Remove-Item $outputFile -Force
}

Write-Line "# ReBloom DB Connection Pool Benchmark"
Write-Line "- generated_at: $(Get-Date -Format o)"
Write-Line "- postgres_image: $postgresImage"
Write-Line "- db_max_connections: $DbMaxConnections"
Write-Line "- normal_user_reserved_slots_note: PostgreSQL reserves a few slots for superusers, so normal application connections can be lower than max_connections."

Remove-BenchmarkContainer
docker run `
    --name $containerName `
    -e POSTGRES_PASSWORD=$postgresPassword `
    -e POSTGRES_DB=$dbName `
    -d $postgresImage `
    -c "max_connections=$DbMaxConnections" | Out-Null

try {
    Wait-ForPostgres

    Invoke-Postgres "CREATE ROLE $appUser LOGIN PASSWORD '$appPassword' NOSUPERUSER;" | Out-Null
    Invoke-Postgres "GRANT CONNECT ON DATABASE $dbName TO $appUser;" | Out-Null

    $usableConnections = Invoke-Postgres "SELECT setting::int - (SELECT setting::int FROM pg_settings WHERE name = 'superuser_reserved_connections') FROM pg_settings WHERE name = 'max_connections';"
    Write-Line "- estimated_normal_app_connection_slots: $($usableConnections.Trim())"

    $before = Invoke-ConnectionScenario -Name "before_unbounded_pod_pool" -Pods $BeforePods -PoolSize $BeforePoolSize
    Start-Sleep -Seconds 2
    $after = Invoke-ConnectionScenario -Name "after_sized_pod_pool" -Pods $AfterPods -PoolSize $AfterPoolSize

    Write-Line ""
    Write-Line "## Summary"
    Write-Line "| metric | before | after |"
    Write-Line "| --- | ---: | ---: |"
    Write-Line "| attempted_connections | $($before.AttemptedConnections) | $($after.AttemptedConnections) |"
    Write-Line "| successful_connections | $($before.SuccessfulConnections) | $($after.SuccessfulConnections) |"
Write-Line "| failed_connections | $($before.FailedConnections) | $($after.FailedConnections) |"
Write-Line "| failure_rate_percent | $($before.FailureRatePercent) | $($after.FailureRatePercent) |"
Write-Line "| max_observed_active_db_connections | $($before.MaxObservedActiveDbConnections) | $($after.MaxObservedActiveDbConnections) |"
    Write-Line "| scenario_wall_time_ms | $($before.ScenarioWallTimeMs) | $($after.ScenarioWallTimeMs) |"
}
finally {
    Remove-BenchmarkContainer
}

Copy-Item -Path $outputFile -Destination $latestFile -Force
Write-Host "Saved benchmark output:"
Write-Host "  $outputFile"
Write-Host "  $latestFile"
