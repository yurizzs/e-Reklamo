<?php

namespace App\Http\Controllers\API\v1;

use App\Http\Controllers\Controller;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\Complaint;
use App\Models\User;
use App\Models\Employee;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;

class ChatController extends Controller
{
    use ApiResponse;

    public function conversations(Request $request)
    {
        $authUser = $request->user() ?? auth('sanctum')->user();

        $query = Conversation::with(['user', 'complaint.user', 'messages' => function ($q) {
            $q->orderBy('created_at', 'asc');
        }]);

        // If authenticated user is a citizen (mobile app), filter to their conversations only
        if ($authUser && get_class($authUser) === User::class) {
            $fullName = trim("{$authUser->first_name} {$authUser->last_name}");
            $query->where(function ($q) use ($authUser, $fullName) {
                $q->where('user_id', $authUser->id)
                  ->orWhereHas('complaint', function ($cq) use ($authUser) {
                      $cq->where('user_id', $authUser->id);
                  })
                  ->orWhereHas('messages', function ($mq) use ($authUser, $fullName) {
                      $mq->where('sender_id', $authUser->id)
                        ->orWhere('sender_name', 'LIKE', "%{$fullName}%");
                  });
            });
        } elseif ($request->header('X-Sender-Name') || $request->query('sender_name')) {
            $sName = trim($request->header('X-Sender-Name') ?? $request->query('sender_name'));
            if (!empty($sName)) {
                $query->where(function ($q) use ($sName) {
                    $q->whereHas('messages', function ($mq) use ($sName) {
                        $mq->where('sender_name', 'LIKE', "%{$sName}%");
                    })
                    ->orWhereHas('user', function ($uq) use ($sName) {
                        $uq->whereRaw("CONCAT(COALESCE(first_name, ''), ' ', COALESCE(last_name, '')) LIKE ?", ["%{$sName}%"]);
                    })
                    ->orWhereHas('complaint', function ($cq) use ($sName) {
                        $cq->where('complainant_first_name', 'LIKE', "%{$sName}%")
                          ->orWhereHas('user', function ($uq) use ($sName) {
                              $uq->whereRaw("CONCAT(COALESCE(first_name, ''), ' ', COALESCE(last_name, '')) LIKE ?", ["%{$sName}%"]);
                          });
                    });
                });
            }
        }

        $conversations = $query->orderBy('updated_at', 'desc')->get();

        $data = $conversations->map(function ($conv) {
            $lastMsg = $conv->messages->last();
            $complaint = $conv->complaint;
            
            // Find non-staff message to get citizen/operator participant details
            $userMsg = $conv->messages->where('sender_type', 'user')->last()
                ?? $conv->messages->where('sender_role', 'citizen')->last()
                ?? $conv->messages->first();

            $participantName = '';
            $participantRole = 'citizen';
            $avatar = null;

            if ($conv->user && !empty(trim("{$conv->user->first_name} {$conv->user->last_name}"))) {
                $participantName = trim("{$conv->user->first_name} {$conv->user->last_name}");
                $avatar = $conv->user->avatar;
            } elseif ($complaint && $complaint->user && !empty(trim("{$complaint->user->first_name} {$complaint->user->last_name}"))) {
                $participantName = trim("{$complaint->user->first_name} {$complaint->user->last_name}");
                $avatar = $complaint->user->avatar;
            } elseif ($complaint && ($complaint->complainant_first_name || $complaint->complainant_last_name)) {
                $participantName = trim("{$complaint->complainant_first_name} {$complaint->complainant_last_name}");
            } elseif ($userMsg && !empty($userMsg->sender_name)) {
                $participantName = $userMsg->sender_name;
                $participantRole = $userMsg->sender_role ?? 'citizen';
            }

            if (empty($participantName) || strtolower($participantName) === 'citizen') {
                $participantName = ($userMsg && !empty($userMsg->sender_name) && strtolower($userMsg->sender_name) !== 'citizen') 
                    ? $userMsg->sender_name 
                    : 'Juan Dela Cruz';
            }

            return [
                'id' => $conv->id,
                'complaint_id' => $conv->complaint_id,
                'complaint_title' => $complaint?->title ?? 'Direct Mobile Inquiry',
                'complaint_status' => $complaint?->status ?? 'new',
                'participant_name' => $participantName,
                'participant_role' => $participantRole,
                'avatar' => $avatar,
                'last_message' => $lastMsg?->message_text ?? 'No messages yet.',
                'last_message_time' => $lastMsg?->created_at ? $lastMsg->created_at->diffForHumans() : null,
                'updated_at' => $conv->updated_at ? $conv->updated_at->toDateTimeString() : null,
            ];
        });

        // Deduplicate conversations per participant so staff only sees one unified chat per citizen
        $uniqueData = collect();
        $seenParticipants = [];

        foreach ($data as $convItem) {
            $key = !empty($convItem['participant_name']) ? strtolower(trim($convItem['participant_name'])) : 'id_'.$convItem['id'];
            if (!in_array($key, $seenParticipants)) {
                $seenParticipants[] = $key;
                $uniqueData->push($convItem);
            }
        }

        return $this->success(
            'Conversations retrieved successfully',
            ['conversations' => $uniqueData->values()],
            200
        );
    }

    public function messages(Request $request, $id)
    {
        $conversation = Conversation::with(['complaint.user', 'messages'])->findOrFail($id);

        $messages = $conversation->messages->map(function ($msg) {
            return [
                'id' => $msg->id,
                'conversation_id' => $msg->conversation_id,
                'sender_type' => $msg->sender_type,
                'sender_id' => $msg->sender_id,
                'sender_name' => $msg->sender_name,
                'sender_role' => $msg->sender_role,
                'message_text' => $msg->message_text,
                'created_at' => $msg->created_at ? $msg->created_at->toDateTimeString() : null,
                'time_formatted' => $msg->created_at ? $msg->created_at->format('g:i A') : '',
            ];
        });

        return $this->success(
            'Messages retrieved successfully',
            [
                'conversation_id' => $conversation->id,
                'complaint' => $conversation->complaint ? [
                    'id' => $conversation->complaint->id,
                    'title' => $conversation->complaint->title,
                    'status' => $conversation->complaint->status,
                ] : null,
                'messages' => $messages,
            ],
            200
        );
    }

    public function sendMessage(Request $request)
    {
        $validated = $request->validate([
            'conversation_id' => ['nullable', 'integer'],
            'complaint_id' => ['nullable', 'integer'],
            'message_text' => ['required', 'string', 'max:2000'],
            'sender_name' => ['nullable', 'string', 'max:255'],
            'sender_role' => ['nullable', 'string', 'max:50'],
        ]);

        $authUser = $request->user() ?? auth('sanctum')->user();
        $senderType = 'user';
        $senderRole = $validated['sender_role'] ?? 'citizen';
        $senderName = $validated['sender_name'] ?? 'Mobile Citizen';

        if ($authUser) {
            $senderName = trim("{$authUser->first_name} {$authUser->last_name}");
            if (get_class($authUser) === Employee::class) {
                $senderType = 'employee';
                $senderRole = is_object($authUser->role) ? $authUser->role->value : (string) $authUser->role;
            } else {
                $senderType = 'user';
                $senderRole = 'citizen';
            }
        }

        $convId = $validated['conversation_id'] ?? null;
        $complaintId = $validated['complaint_id'] ?? null;

        $conv = null;

        // 1. If explicit conversation_id passed, use it directly
        if ($convId && $convId > 0) {
            $conv = Conversation::find($convId);
        }

        // 2. If no valid conversation found by ID yet:
        if (!$conv) {
            if ($authUser && get_class($authUser) === User::class) {
                $conv = Conversation::where('user_id', $authUser->id)->first();
            } elseif ($complaintId && $complaintId > 0) {
                $conv = Conversation::where('complaint_id', $complaintId)->first();
            }

            if (!$conv && !empty($senderName) && $senderName !== 'Citizen User' && $senderType === 'user') {
                $conv = Conversation::whereHas('messages', function ($q) use ($senderName) {
                    $q->where('sender_name', $senderName)->where('sender_type', 'user');
                })->first();
            }
        }

        // 3. If still no conversation exists, create a single conversation record
        if (!$conv) {
            $conv = Conversation::create([
                'user_id' => ($authUser && get_class($authUser) === User::class) ? $authUser->id : null,
                'complaint_id' => ($complaintId && $complaintId > 0) ? $complaintId : null,
            ]);
        }

        $message = Message::create([
            'conversation_id' => $conv->id,
            'sender_type' => $senderType,
            'sender_id' => $authUser?->id ?? null,
            'sender_name' => $senderName,
            'sender_role' => $senderRole,
            'message_text' => $validated['message_text'],
        ]);

        // Touch conversation updated_at timestamp
        $conv->touch();

        return $this->success(
            'Message sent successfully',
            [
                'message' => [
                    'id' => $message->id,
                    'conversation_id' => $message->conversation_id,
                    'sender_type' => $message->sender_type,
                    'sender_id' => $message->sender_id,
                    'sender_name' => $message->sender_name,
                    'sender_role' => $message->sender_role,
                    'message_text' => $message->message_text,
                    'created_at' => $message->created_at->toDateTimeString(),
                    'time_formatted' => $message->created_at->format('g:i A'),
                ],
            ],
            201
        );
    }
}
