<?php

namespace App\Http\Controllers\API\v1;

use App\Http\Controllers\Controller;
use App\Models\Announcement;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AnnouncementController extends Controller
{
    use ApiResponse;

    /**
     * Display a listing of announcements.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Announcement::query();

        if ($request->filled('type') && $request->input('type') !== 'all') {
            $query->where('type', $request->input('type'));
        }

        if ($request->filled('urgency') && $request->input('urgency') !== 'all') {
            $query->where('urgency', $request->input('urgency'));
        }

        if ($request->filled('search')) {
            $search = '%' . trim($request->input('search')) . '%';
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', $search)
                  ->orWhere('ref_number', 'like', $search)
                  ->orWhere('summary', 'like', $search)
                  ->orWhere('issuing_office', 'like', $search)
                  ->orWhere('legal_basis', 'like', $search);
            });
        }

        $announcements = $query->orderBy('id', 'desc')->get();

        $data = $announcements->map(fn($item) => $item->toResponseArray());

        return $this->success('Announcements retrieved successfully.', $data);
    }

    /**
     * Store a newly created announcement.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'type' => ['required', 'string', 'in:memorandum,announcement,directive'],
            'refNumber' => ['nullable', 'string', 'max:100'],
            'ref_number' => ['nullable', 'string', 'max:100'],
            'title' => ['required', 'string', 'max:500'],
            'summary' => ['required', 'string'],
            'issuingOffice' => ['nullable', 'string', 'max:255'],
            'issuing_office' => ['nullable', 'string', 'max:255'],
            'date' => ['nullable', 'string', 'max:100'],
            'effectiveDate' => ['nullable', 'string', 'max:100'],
            'effective_date' => ['nullable', 'string', 'max:100'],
            'urgency' => ['nullable', 'string', 'in:routine,priority,urgent'],
            'legalBasis' => ['nullable', 'string'],
            'legal_basis' => ['nullable', 'string'],
            'keyDirectives' => ['nullable', 'array'],
            'key_directives' => ['nullable', 'array'],
            'signatories' => ['nullable', 'array'],
            'publishToMobile' => ['nullable', 'boolean'],
            'publish_to_mobile' => ['nullable', 'boolean'],
            'sendPushAlert' => ['nullable', 'boolean'],
            'send_push_alert' => ['nullable', 'boolean'],
        ]);

        $type = $validated['type'];
        $badgeLabel = match ($type) {
            'memorandum' => 'OFFICIAL MEMORANDUM',
            'directive' => 'REGULATORY DIRECTIVE',
            default => 'PUBLIC ADVISORY',
        };

        $refNumber = $validated['ref_number'] ?? $validated['refNumber'] ?? null;
        if (!$refNumber) {
            $prefix = match ($type) {
                'memorandum' => 'TMU-MC',
                'directive' => 'JRD-TRB',
                default => 'PA-TMU',
            };
            $refNumber = $prefix . '-' . date('Y-m') . '-' . rand(100, 999);
        }

        $userId = Auth::id();

        $announcement = Announcement::create([
            'type' => $type,
            'badge_label' => $badgeLabel,
            'ref_number' => $refNumber,
            'title' => $validated['title'],
            'summary' => $validated['summary'],
            'issuing_office' => $validated['issuing_office'] ?? $validated['issuingOffice'] ?? 'Traffic Management Unit (TMU)',
            'date' => $validated['date'] ?? date('F d, Y'),
            'effective_date' => $validated['effective_date'] ?? $validated['effectiveDate'] ?? null,
            'urgency' => $validated['urgency'] ?? 'routine',
            'legal_basis' => $validated['legal_basis'] ?? $validated['legalBasis'] ?? null,
            'key_directives' => $validated['key_directives'] ?? $validated['keyDirectives'] ?? [],
            'signatories' => $validated['signatories'] ?? [],
            'publish_to_mobile' => $validated['publish_to_mobile'] ?? $validated['publishToMobile'] ?? true,
            'send_push_alert' => $validated['send_push_alert'] ?? $validated['sendPushAlert'] ?? false,
            'created_by' => $userId,
        ]);

        return $this->success('Announcement published successfully.', $announcement->toResponseArray(), 201);
    }

    /**
     * Display the specified announcement.
     */
    public function show(string $id): JsonResponse
    {
        $announcement = Announcement::find($id);

        if (!$announcement) {
            return $this->error('Announcement not found.', 404);
        }

        return $this->success('Announcement retrieved successfully.', $announcement->toResponseArray());
    }

    /**
     * Remove the specified announcement from storage.
     */
    public function destroy(string $id): JsonResponse
    {
        $announcement = Announcement::find($id);

        if (!$announcement) {
            return $this->error('Announcement not found.', 404);
        }

        $announcement->delete();

        return $this->success('Announcement deleted successfully.');
    }
}
