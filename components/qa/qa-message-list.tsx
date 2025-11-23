'use client';

import { Message, User, Profile } from '@prisma/client';

interface MessageWithSender extends Message {
  sender: User & {
    profile: Profile | null;
  };
}

interface QAMessageListProps {
  messages: MessageWithSender[];
  currentUserId: string;
}

export function QAMessageList({ messages, currentUserId }: QAMessageListProps) {
  if (messages.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg mb-2">No messages yet</p>
        <p className="text-gray-400 text-sm">Be the first to ask a question!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {messages.map((message) => {
        const isCurrentUser = message.senderId === currentUserId;
        const senderName = message.sender.profile?.name || message.sender.email.split('@')[0];

        return (
          <div
            key={message.id}
            className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[70%] ${isCurrentUser ? 'order-2' : 'order-1'}`}>
              <div
                className={`rounded-lg p-4 ${
                  isCurrentUser
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                {!isCurrentUser && (
                  <p className="text-xs font-semibold mb-1 text-gray-600">
                    Expert Reviewer
                  </p>
                )}
                <p className="whitespace-pre-wrap">{message.text}</p>
                {message.attachmentUrl && (
                  <a
                    href={message.attachmentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`text-sm mt-2 block underline ${
                      isCurrentUser ? 'text-blue-100' : 'text-blue-600'
                    }`}
                  >
                    View Attachment
                  </a>
                )}
              </div>
              <p className={`text-xs text-gray-500 mt-1 ${isCurrentUser ? 'text-right' : 'text-left'}`}>
                {new Date(message.createdAt).toLocaleString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
