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
        $user = Auth::user() ?? $request->user();
        $userRole = is_object($user?->role) && isset($user->role->value) 
            ? $user->role->value 
            : (string) ($user?->role ?? '');

        if (!in_array($userRole, ['staff', 'admin'])) {
            return $this->error('Only TMU Staff members are authorized to publish announcements.', 403);
        }

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
     * Update the specified announcement in storage.
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $user = Auth::user() ?? $request->user();
        $userRole = is_object($user?->role) && isset($user->role->value) 
            ? $user->role->value 
            : (string) ($user?->role ?? '');

        if (!in_array($userRole, ['staff', 'admin'])) {
            return $this->error('Only TMU Staff members are authorized to update announcements.', 403);
        }

        $announcement = Announcement::find($id);

        if (!$announcement) {
            return $this->error('Announcement not found.', 404);
        }

        $validated = $request->validate([
            'type' => ['nullable', 'string', 'in:memorandum,announcement,directive'],
            'badge_label' => ['nullable', 'string', 'max:255'],
            'badgeLabel' => ['nullable', 'string', 'max:255'],
            'refNumber' => ['nullable', 'string', 'max:100'],
            'ref_number' => ['nullable', 'string', 'max:100'],
            'title' => ['sometimes', 'required', 'string', 'max:500'],
            'summary' => ['sometimes', 'required', 'string'],
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

        $updateData = [];

        if (isset($validated['type'])) {
            $updateData['type'] = $validated['type'];
            $updateData['badge_label'] = match ($validated['type']) {
                'memorandum' => 'OFFICIAL MEMORANDUM',
                'directive' => 'REGULATORY DIRECTIVE',
                default => 'PUBLIC ADVISORY',
            };
        }

        if (array_key_exists('badge_label', $validated) || array_key_exists('badgeLabel', $validated)) {
            $updateData['badge_label'] = $validated['badge_label'] ?? $validated['badgeLabel'];
        }

        if (isset($validated['title'])) {
            $updateData['title'] = $validated['title'];
        }

        if (isset($validated['summary'])) {
            $updateData['summary'] = $validated['summary'];
        }

        if (array_key_exists('ref_number', $validated) || array_key_exists('refNumber', $validated)) {
            $updateData['ref_number'] = $validated['ref_number'] ?? $validated['refNumber'];
        }

        if (array_key_exists('issuing_office', $validated) || array_key_exists('issuingOffice', $validated)) {
            $updateData['issuing_office'] = $validated['issuing_office'] ?? $validated['issuingOffice'];
        }

        if (isset($validated['date'])) {
            $updateData['date'] = $validated['date'];
        }

        if (array_key_exists('effective_date', $validated) || array_key_exists('effectiveDate', $validated)) {
            $updateData['effective_date'] = $validated['effective_date'] ?? $validated['effectiveDate'];
        }

        if (isset($validated['urgency'])) {
            $updateData['urgency'] = $validated['urgency'];
        }

        if (array_key_exists('legal_basis', $validated) || array_key_exists('legalBasis', $validated)) {
            $updateData['legal_basis'] = $validated['legal_basis'] ?? $validated['legalBasis'];
        }

        if (isset($validated['key_directives']) || isset($validated['keyDirectives'])) {
            $updateData['key_directives'] = $validated['key_directives'] ?? $validated['keyDirectives'];
        }

        if (isset($validated['signatories'])) {
            $updateData['signatories'] = $validated['signatories'];
        }

        if (isset($validated['publish_to_mobile']) || isset($validated['publishToMobile'])) {
            $updateData['publish_to_mobile'] = $validated['publish_to_mobile'] ?? $validated['publishToMobile'];
        }

        if (isset($validated['send_push_alert']) || isset($validated['sendPushAlert'])) {
            $updateData['send_push_alert'] = $validated['send_push_alert'] ?? $validated['sendPushAlert'];
        }

        $announcement->update($updateData);

        return $this->success('Announcement updated successfully.', $announcement->fresh()->toResponseArray());
    }

    /**
     * Remove the specified announcement from storage.
     */
    public function destroy(Request $request, string $id): JsonResponse
    {
        $user = Auth::user() ?? $request->user();
        $userRole = is_object($user?->role) && isset($user->role->value) 
            ? $user->role->value 
            : (string) ($user?->role ?? '');

        if (!in_array($userRole, ['staff', 'admin'])) {
            return $this->error('Only TMU Staff members are authorized to delete announcements.', 403);
        }

        $announcement = Announcement::find($id);

        if (!$announcement) {
            return $this->error('Announcement not found.', 404);
        }

        $announcement->delete();

        return $this->success('Announcement deleted successfully.');
    }
}
