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

        // Ensure all complaints have a corresponding conversation record
        $allComplaints = Complaint::with('user')->get();
        foreach ($allComplaints as $c) {
            $conv = Conversation::firstOrCreate(
                ['complaint_id' => $c->id],
                ['user_id' => $c->user_id ?? null]
            );

            // Ensure an initial message exists if conversation has no messages yet
            if ($conv->messages()->count() === 0) {
                $citizenName = $c->user 
                    ? trim("{$c->user->first_name} {$c->user->last_name}") 
                    : trim("{$c->complainant_first_name} {$c->complainant_last_name}");
                
                if (empty($citizenName)) {
                    $citizenName = "Citizen Inquiry";
                }

                Message::create([
                    'conversation_id' => $conv->id,
                    'sender_type' => 'user',
                    'sender_id' => $c->user_id ?? null,
                    'sender_name' => $citizenName,
                    'sender_role' => 'citizen',
                    'message_text' => "Hello TMU support, regarding complaint report '{$c->title}' at {$c->incident_location}.",
                    'created_at' => $c->created_at ?? now(),
                ]);
            }
        }

        $query = Conversation::with(['complaint.user', 'messages' => function ($q) {
            $q->orderBy('created_at', 'asc');
        }]);

        // If authenticated user is a citizen (mobile app), filter to their conversations only
        if ($authUser && get_class($authUser) === User::class) {
            $query->where(function ($q) use ($authUser) {
                $q->where('user_id', $authUser->id)
                  ->orWhereHas('complaint', function ($cq) use ($authUser) {
                      $cq->where('user_id', $authUser->id);
                  })
                  ->orWhereHas('messages', function ($mq) use ($authUser) {
                      $mq->where('sender_id', $authUser->id)->where('sender_type', 'user');
                  });
            });
        }

        $conversations = $query->orderBy('updated_at', 'desc')->get();

        $data = $conversations->map(function ($conv) {
            $lastMsg = $conv->messages->last();
            $complaint = $conv->complaint;
            
            // Find non-staff message to get citizen/operator participant details
            $participantMsg = $conv->messages->whereNotIn('sender_role', ['staff', 'admin', 'operator'])->last() 
                ?? $conv->messages->first();

            $participantName = 'Citizen Inquiry';
            $participantRole = 'citizen';
            $avatar = null;

            if ($complaint && $complaint->user) {
                $participantName = trim("{$complaint->user->first_name} {$complaint->user->last_name}");
                $avatar = $complaint->user->avatar;
            } elseif ($complaint && ($complaint->complainant_first_name || $complaint->complainant_last_name)) {
                $participantName = trim("{$complaint->complainant_first_name} {$complaint->complainant_last_name}");
            } elseif ($participantMsg && $participantMsg->sender_name) {
                $participantName = $participantMsg->sender_name;
                $participantRole = $participantMsg->sender_role ?? 'citizen';
            }

            return [
                'id' => $conv->id,
                'complaint_id' => $conv->complaint_id,
                'complaint_title' => $complaint?->title ?? 'Direct Mobile Inquiry',
                'complaint_status' => $complaint?->status ?? 'new',
                'participant_name' => $participantName ?: 'Citizen Inquiry',
                'participant_role' => $participantRole,
                'avatar' => $avatar,
                'last_message' => $lastMsg?->message_text ?? 'No messages yet.',
                'last_message_time' => $lastMsg?->created_at ? $lastMsg->created_at->diffForHumans() : null,
                'updated_at' => $conv->updated_at ? $conv->updated_at->toDateTimeString() : null,
            ];
        });

        return $this->success(
            'Conversations retrieved successfully',
            ['conversations' => $data],
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
        if ($convId && $convId > 0) {
            $conv = Conversation::find($convId);
        }

        if (!$conv && $complaintId && $complaintId > 0) {
            $conv = Conversation::firstOrCreate(
                ['complaint_id' => $complaintId],
                ['user_id' => $authUser?->id]
            );
        }

        if (!$conv) {
            if ($authUser && get_class($authUser) === User::class) {
                $conv = Conversation::where('user_id', $authUser->id)->first();
            } elseif (!empty($senderName)) {
                $conv = Conversation::whereHas('messages', function ($q) use ($senderName) {
                    $q->where('sender_name', $senderName);
                })->first();
            }
        }

        if (!$conv) {
            $conv = Conversation::create([
                'user_id' => ($authUser && get_class($authUser) === User::class) ? $authUser->id : null,
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
