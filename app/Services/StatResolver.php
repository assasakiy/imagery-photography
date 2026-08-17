<?php

namespace App\Services;

use App\Models\Project;
use App\Models\Review;

class StatResolver
{
    protected array $resolvers = [
        'projects_completed' => 'projectsCompleted',
        'clients' => 'clients',
        'avg_rating' => 'avgRating',
        'years_experience' => 'yearsExperience',
    ];

    protected array $labels = [
        'projects_completed' => 'Proyek Selesai',
        'clients' => 'Jumlah Klien',
        'avg_rating' => 'Rating Rata-rata',
        'years_experience' => 'Tahun Pengalaman',
    ];

    public function supportedMetrics(): array
    {
        return array_keys($this->resolvers);
    }

    public function label(string $metric): string
    {
        return $this->labels[$metric] ?? $metric;
    }

    public function raw(string $metric): ?float
    {
        if (!isset($this->resolvers[$metric])) {
            return null;
        }

        return $this->{$this->resolvers[$metric]}();
    }

    public function value(string $metric): ?string
    {
        $raw = $this->raw($metric);

        if ($raw === null) {
            return null;
        }

        if ($metric === 'avg_rating') {
            return number_format($raw, 1, '.', '');
        }

        return (string) (int) $raw;
    }

    public function resolve(?string $metric, ?string $base): ?string
    {
        if (!$metric) {
            return null;
        }

        $value = $this->value($metric);

        if ($value === null) {
            return null;
        }

        if ($base !== null && is_numeric($base)) {
            $value = (string) ((int) $value + (int) $base);
        }

        return $value;
    }

    protected function projectsCompleted(): float
    {
        return (float) Project::where('status', 'completed')->count();
    }

    protected function clients(): float
    {
        return (float) Project::whereNotNull('user_id')->distinct()->count('user_id');
    }

    protected function avgRating(): float
    {
        return (float) Review::whereNotNull('rating')->avg('rating');
    }

    protected function yearsExperience(): float
    {
        $earliest = Project::min('created_at');

        if (!$earliest) {
            return 0;
        }

        return max(1.0, (float) floor(now()->diffInYears($earliest)));
    }
}