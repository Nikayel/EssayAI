'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToastActions } from '@/components/ui/toast';

interface QAMessageFormProps {
  orderId: string;
}

export function QAMessageForm({ orderId }: QAMessageFormProps) {
  const router = useRouter();
  const toast = useToastActions();
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
        throw new Error('Failed to send message');
      }

      setMessage('');
      toast.success('Message sent!');
      router.refresh();
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error('Failed to send message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Ask your question here... Be as specific as possible to get the best answer."
        rows={4}
        className="resize-none"
        disabled={isSubmitting}
      />
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-600">
          Response time: &lt; 2 hours during business hours (9am-6pm ET)
        </p>
        <Button type="submit" disabled={!message.trim() || isSubmitting}>
          {isSubmitting ? (
            'Sending...'
          ) : (
            <>
              Send Message
              <Send className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
