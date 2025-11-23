'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface QAAdminResponseFormProps {
  orderId: string;
}

export function QAAdminResponseForm({ orderId }: QAAdminResponseFormProps) {
  const router = useRouter();
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!message.trim() || isSubmitting) return;

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/qa/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          text: message.trim(),
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to send response');
      }

      setMessage('');
      router.refresh();
    } catch (error) {
      console.error('Failed to send response:', error);
      alert('Failed to send response. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Type your response here... Be thorough and provide actionable advice."
        rows={6}
        className="resize-none"
        disabled={isSubmitting}
      />
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-600">
          Students receive email notifications for new responses
        </p>
        <Button type="submit" disabled={!message.trim() || isSubmitting}>
          {isSubmitting ? (
            'Sending...'
          ) : (
            <>
              Send Response
              <Send className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
