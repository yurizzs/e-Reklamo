<?php

namespace App\Http\Controllers\API\v1;

use App\Http\Controllers\Controller;
use App\Models\Announcement;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

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

        // Support FormData JSON encoded fields
        $keyDirectives = $request->input('key_directives') ?? $request->input('keyDirectives');
        if (is_string($keyDirectives)) {
            $decoded = json_decode($keyDirectives, true);
            if (json_last_error() === JSON_ERROR_NONE) {
                $request->merge(['key_directives' => $decoded, 'keyDirectives' => $decoded]);
            }
        }

        $signatories = $request->input('signatories');
        if (is_string($signatories)) {
            $decoded = json_decode($signatories, true);
            if (json_last_error() === JSON_ERROR_NONE) {
                $request->merge(['signatories' => $decoded]);
            }
        }

        $validated = $request->validate([
            'type' => ['required', 'string', 'in:memorandum,announcement,directive'],
            'refNumber' => ['nullable', 'string', 'max:100'],
            'ref_number' => ['nullable', 'string', 'max:100'],
            'title' => ['required', 'string', 'max:500'],
            'summary' => ['required', 'string'],
            'image' => ['nullable', 'image', 'mimes:jpeg,png,jpg,webp,gif', 'max:10240'],
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
            'publishToMobile' => ['nullable'],
            'publish_to_mobile' => ['nullable'],
            'sendPushAlert' => ['nullable'],
            'send_push_alert' => ['nullable'],
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

        $imagePath = null;
        if ($request->hasFile('image')) {
            $imageFile = $request->file('image');
            $filename = time() . '_' . uniqid() . '.' . $imageFile->getClientOriginalExtension();
            $imagePath = $imageFile->storeAs('announcements', $filename, 'public');
        }

        $publishToMobile = true;
        if ($request->has('publish_to_mobile')) {
            $publishToMobile = filter_var($request->input('publish_to_mobile'), FILTER_VALIDATE_BOOLEAN);
        } elseif ($request->has('publishToMobile')) {
            $publishToMobile = filter_var($request->input('publishToMobile'), FILTER_VALIDATE_BOOLEAN);
        }

        $sendPushAlert = false;
        if ($request->has('send_push_alert')) {
            $sendPushAlert = filter_var($request->input('send_push_alert'), FILTER_VALIDATE_BOOLEAN);
        } elseif ($request->has('sendPushAlert')) {
            $sendPushAlert = filter_var($request->input('sendPushAlert'), FILTER_VALIDATE_BOOLEAN);
        }

        $userId = Auth::id();

        $announcement = Announcement::create([
            'type' => $type,
            'badge_label' => $badgeLabel,
            'ref_number' => $refNumber,
            'title' => $validated['title'],
            'summary' => $validated['summary'],
            'image' => $imagePath,
            'issuing_office' => $validated['issuing_office'] ?? $validated['issuingOffice'] ?? 'Traffic Management Unit (TMU)',
            'date' => $validated['date'] ?? date('F d, Y'),
            'effective_date' => $validated['effective_date'] ?? $validated['effectiveDate'] ?? null,
            'urgency' => $validated['urgency'] ?? 'routine',
            'legal_basis' => $validated['legal_basis'] ?? $validated['legalBasis'] ?? null,
            'key_directives' => $validated['key_directives'] ?? $validated['keyDirectives'] ?? [],
            'signatories' => $validated['signatories'] ?? [],
            'publish_to_mobile' => $publishToMobile,
            'send_push_alert' => $sendPushAlert,
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

        // Support FormData JSON encoded fields
        $keyDirectives = $request->input('key_directives') ?? $request->input('keyDirectives');
        if (is_string($keyDirectives)) {
            $decoded = json_decode($keyDirectives, true);
            if (json_last_error() === JSON_ERROR_NONE) {
                $request->merge(['key_directives' => $decoded, 'keyDirectives' => $decoded]);
            }
        }

        $signatories = $request->input('signatories');
        if (is_string($signatories)) {
            $decoded = json_decode($signatories, true);
            if (json_last_error() === JSON_ERROR_NONE) {
                $request->merge(['signatories' => $decoded]);
            }
        }

        $validated = $request->validate([
            'type' => ['nullable', 'string', 'in:memorandum,announcement,directive'],
            'badge_label' => ['nullable', 'string', 'max:255'],
            'badgeLabel' => ['nullable', 'string', 'max:255'],
            'refNumber' => ['nullable', 'string', 'max:100'],
            'ref_number' => ['nullable', 'string', 'max:100'],
            'title' => ['sometimes', 'required', 'string', 'max:500'],
            'summary' => ['sometimes', 'required', 'string'],
            'image' => ['nullable'],
            'remove_image' => ['nullable'],
            'removeImage' => ['nullable'],
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
            'publishToMobile' => ['nullable'],
            'publish_to_mobile' => ['nullable'],
            'sendPushAlert' => ['nullable'],
            'send_push_alert' => ['nullable'],
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

        if (array_key_exists('publish_to_mobile', $validated) || array_key_exists('publishToMobile', $validated)) {
            $val = $validated['publish_to_mobile'] ?? $validated['publishToMobile'];
            $updateData['publish_to_mobile'] = filter_var($val, FILTER_VALIDATE_BOOLEAN);
        }

        if (array_key_exists('send_push_alert', $validated) || array_key_exists('sendPushAlert', $validated)) {
            $val = $validated['send_push_alert'] ?? $validated['sendPushAlert'];
            $updateData['send_push_alert'] = filter_var($val, FILTER_VALIDATE_BOOLEAN);
        }

        if ($request->hasFile('image')) {
            if ($announcement->image && Storage::disk('public')->exists($announcement->image)) {
                Storage::disk('public')->delete($announcement->image);
            }
            $imageFile = $request->file('image');
            $filename = time() . '_' . uniqid() . '.' . $imageFile->getClientOriginalExtension();
            $updateData['image'] = $imageFile->storeAs('announcements', $filename, 'public');
        } elseif ($request->boolean('remove_image') || $request->boolean('removeImage') || $request->input('image') === 'null') {
            if ($announcement->image && Storage::disk('public')->exists($announcement->image)) {
                Storage::disk('public')->delete($announcement->image);
            }
            $updateData['image'] = null;
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
