<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\File;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class BackupController extends Controller
{
    /**
     * List all database backups.
     */
    public function listBackups(): JsonResponse
    {
        $backupDir = storage_path('app/backups');
        if (!File::exists($backupDir)) {
            File::makeDirectory($backupDir, 0755, true);
        }

        $files = File::files($backupDir);
        $backups = [];

        foreach ($files as $file) {
            if ($file->getExtension() === 'gz' || $file->getExtension() === 'sql') {
                $backups[] = [
                    'filename' => $file->getFilename(),
                    'size_mb' => round($file->getSize() / 1024 / 1024, 2),
                    'size_kb' => round($file->getSize() / 1024, 1),
                    'created_at' => date('Y-m-d H:i:s', $file->getMTime()),
                ];
            }
        }

        // Sort descending by creation date
        usort($backups, fn($a, $b) => strcmp($b['created_at'], $a['created_at']));

        return response()->json([
            'backups' => $backups,
            'total_count' => count($backups),
        ]);
    }

    /**
     * Trigger a new database dump backup.
     */
    public function createBackup(): JsonResponse
    {
        $backupDir = storage_path('app/backups');
        if (!File::exists($backupDir)) {
            File::makeDirectory($backupDir, 0755, true);
        }

        $filename = 'backup_clinic_saas_' . date('Y_m_d_His') . '.sql.gz';
        $filepath = $backupDir . '/' . $filename;

        $dbHost = env('DB_HOST', '127.0.0.1');
        $dbName = env('DB_DATABASE', 'clinic_saas_db');
        $dbUser = env('DB_USERNAME', 'clinic_user');
        $dbPass = env('DB_PASSWORD', 'clinic_secure_password123');

        // Execute mysqldump via Docker container
        $cmd = "docker exec clinic_mysql mysqldump -u {$dbUser} -p{$dbPass} {$dbName} 2>/dev/null | gzip > " . escapeshellarg($filepath);
        exec($cmd, $output, $returnCode);

        if ($returnCode !== 0 || !File::exists($filepath) || File::size($filepath) === 0) {
            // Fallback host mysqldump
            $fallbackCmd = "mysqldump -h {$dbHost} -u {$dbUser} -p{$dbPass} {$dbName} 2>/dev/null | gzip > " . escapeshellarg($filepath);
            exec($fallbackCmd, $outputFallback, $returnCodeFallback);

            if ($returnCodeFallback !== 0 || !File::exists($filepath)) {
                return response()->json([
                    'message' => 'Échec de la sauvegarde de la base de données.',
                ], 500);
            }
        }

        return response()->json([
            'message' => 'Sauvegarde de la base de données générée avec succès.',
            'backup' => [
                'filename' => $filename,
                'size_kb' => round(File::size($filepath) / 1024, 1),
                'created_at' => date('Y-m-d H:i:s'),
            ],
        ], 201);
    }

    /**
     * Download backup file.
     */
    public function downloadBackup(string $filename): BinaryFileResponse|JsonResponse
    {
        // Sanitize filename to prevent path traversal
        if (!preg_match('/^[a-zA-Z0-9_\-\.]+\.(sql|sql\.gz)$/', $filename)) {
            return response()->json(['message' => 'Nom de fichier invalide.'], 400);
        }

        $filepath = storage_path('app/backups/' . $filename);

        if (!File::exists($filepath)) {
            return response()->json(['message' => 'Fichier de sauvegarde introuvable.'], 404);
        }

        return response()->download($filepath, $filename, [
            'Content-Type' => 'application/gzip',
        ]);
    }
}
