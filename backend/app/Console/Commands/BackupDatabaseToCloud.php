<?php

namespace App\Console\Commands;

use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class BackupDatabaseToCloud extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'backup:cloud {--disk=r2 : The cloud disk to upload to (r2, s3, or local)} {--keep-days=30 : Number of days to retain backups}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Creates a compressed MySQL database dump, uploads to S3/R2 cloud storage, and purges expired backups.';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $timestamp = Carbon::now()->format('Y_m_d_His');
        $filename = "backup_clinic_saas_{$timestamp}.sql.gz";
        $backupDir = storage_path('app/backups');

        if (!File::isDirectory($backupDir)) {
            File::makeDirectory($backupDir, 0755, true);
        }

        $localFilePath = "{$backupDir}/{$filename}";
        $this->info("🔄 Initiating database backup: {$filename}");

        $dbHost = config('database.connections.mysql.host', '127.0.0.1');
        $dbPort = config('database.connections.mysql.port', '3306');
        $dbName = config('database.connections.mysql.database', 'clinic_saas_db');
        $dbUser = config('database.connections.mysql.username', 'root');
        $dbPass = config('database.connections.mysql.password', '');

        $dumpSuccess = false;

        // 1. Try mysqldump command with --no-tablespaces
        try {
            $passParam = $dbPass ? "-p" . escapeshellarg($dbPass) : "";
            $cmd = sprintf(
                'mysqldump --host=%s --port=%s --user=%s %s --no-tablespaces --single-transaction --quick --skip-lock-tables %s 2>/dev/null | gzip > %s',
                escapeshellarg($dbHost),
                escapeshellarg($dbPort),
                escapeshellarg($dbUser),
                $passParam,
                escapeshellarg($dbName),
                escapeshellarg($localFilePath)
            );

            exec($cmd, $output, $returnCode);

            if ($returnCode === 0 && file_exists($localFilePath) && filesize($localFilePath) > 100) {
                $dumpSuccess = true;
                $this->info("✅ mysqldump executed successfully.");
            }
        } catch (\Throwable $e) {
            $this->warn("mysqldump CLI command failed, switching to PHP PDO dumper fallback: " . $e->getMessage());
        }

        // 2. Fallback to PHP PDO dumper if mysqldump was unavailable
        if (!$dumpSuccess) {
            $this->info("📦 Running PHP PDO table dumper fallback...");
            $dumpContent = $this->dumpDatabaseViaPdo();
            $compressed = gzencode($dumpContent, 9);
            file_put_contents($localFilePath, $compressed);
            $dumpSuccess = true;
        }

        $fileSizeMb = round(filesize($localFilePath) / (1024 * 1024), 2);
        $this->info("📊 Backup file created: {$filename} ({$fileSizeMb} MB)");

        // 3. Upload to Cloud Storage Disk (R2 / S3) if available
        $diskName = $this->option('disk') ?: 'r2';
        $cloudUploaded = false;

        if ($diskName !== 'local') {
            try {
                $cloudPath = "database-backups/{$filename}";
                $fileStream = fopen($localFilePath, 'r');
                
                if (config("filesystems.disks.{$diskName}")) {
                    $uploaded = Storage::disk($diskName)->put($cloudPath, $fileStream);
                    if ($uploaded) {
                        $cloudUploaded = true;
                        $this->info("☁️ Uploaded successfully to Cloud Disk [{$diskName}]: {$cloudPath}");
                    }
                }
            } catch (\Throwable $e) {
                $this->warn("⚠️ Cloud upload to [{$diskName}] skipped or failed (will retain local backup): " . $e->getMessage());
                Log::warning("Cloud backup upload to [{$diskName}] failed: " . $e->getMessage());
            }
        }

        // 4. Purge backups older than keep-days
        $keepDays = (int)($this->option('keep-days') ?: 30);
        $purgeBefore = Carbon::now()->subDays($keepDays);

        $this->purgeLocalBackups($backupDir, $purgeBefore);
        if ($cloudUploaded) {
            $this->purgeCloudBackups($diskName, $purgeBefore);
        }

        $this->info("🎉 Backup process completed successfully at " . Carbon::now()->toDateTimeString());
        return 0;
    }

    /**
     * Fallback database dumper via PDO.
     */
    private function dumpDatabaseViaPdo(): string
    {
        $pdo = DB::connection()->getPdo();
        $dbName = config('database.connections.mysql.database');
        
        $sql = "-- PsyPro Clinic SaaS MySQL Dump\n";
        $sql .= "-- Generated: " . Carbon::now()->toDateTimeString() . "\n";
        $sql .= "-- Database: {$dbName}\n\n";
        $sql .= "SET FOREIGN_KEY_CHECKS=0;\n\n";

        $tables = DB::select('SHOW TABLES');
        $dbKey = "Tables_in_{$dbName}";

        foreach ($tables as $tableObj) {
            $tableName = $tableObj->$dbKey ?? array_values((array)$tableObj)[0];

            // Table Structure
            $createTable = DB::select("SHOW CREATE TABLE `{$tableName}`");
            $sql .= "\n-- Table structure for `{$tableName}`\n";
            $sql .= "DROP TABLE IF EXISTS `{$tableName}`;\n";
            $sql .= $createTable[0]->{'Create Table'} . ";\n\n";

            // Table Data
            $rows = DB::table($tableName)->get();
            if ($rows->count() > 0) {
                $sql .= "-- Dumping data for `{$tableName}`\n";
                foreach ($rows as $row) {
                    $values = array_map(function ($val) use ($pdo) {
                        return is_null($val) ? 'NULL' : $pdo->quote($val);
                    }, (array)$row);

                    $sql .= "INSERT INTO `{$tableName}` VALUES (" . implode(', ', $values) . ");\n";
                }
                $sql .= "\n";
            }
        }

        $sql .= "SET FOREIGN_KEY_CHECKS=1;\n";
        return $sql;
    }

    /**
     * Purge old local backups.
     */
    private function purgeLocalBackups(string $dir, Carbon $purgeBefore): void
    {
        $files = File::files($dir);
        foreach ($files as $file) {
            if ($file->getExtension() === 'gz' || $file->getExtension() === 'sql') {
                $fileMtime = Carbon::createFromTimestamp($file->getMTime());
                if ($fileMtime->lt($purgeBefore)) {
                    File::delete($file->getRealPath());
                    $this->line("🗑️ Deleted expired local backup: " . $file->getFilename());
                }
            }
        }
    }

    /**
     * Purge old cloud backups from S3/R2.
     */
    private function purgeCloudBackups(string $diskName, Carbon $purgeBefore): void
    {
        try {
            $cloudFiles = Storage::disk($diskName)->files('database-backups');
            foreach ($cloudFiles as $filePath) {
                $lastModified = Storage::disk($diskName)->lastModified($filePath);
                if (Carbon::createFromTimestamp($lastModified)->lt($purgeBefore)) {
                    Storage::disk($diskName)->delete($filePath);
                    $this->line("🗑️ Deleted expired cloud backup: {$filePath}");
                }
            }
        } catch (\Throwable $e) {
            // Silently handle cloud purge error
        }
    }
}
