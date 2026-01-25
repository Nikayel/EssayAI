'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useRouter } from 'next/navigation';
import { useToastActions } from '@/components/ui/toast';

export function ProfileForm({ user }: { user: any }) {
  const router = useRouter();
  const toast = useToastActions();
  const [formData, setFormData] = useState({
    name: user.profile?.name || '',
    gradeLevel: user.profile?.gradeLevel || '',
    intendedMajor: user.profile?.intendedMajor || '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error('Failed to update profile');

      toast.success('Profile updated successfully!');
      router.refresh();
    } catch (error) {
      console.error('Profile update error:', error);
      toast.error('Failed to update profile. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Full Name</Label>
        <Input
          id="name"
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="John Doe"
        />
      </div>

      <div>
        <Label htmlFor="gradeLevel">Grade Level</Label>
        <select
          id="gradeLevel"
          className="w-full mt-1 px-3 py-2 border rounded-md"
          value={formData.gradeLevel}
          onChange={(e) => setFormData({ ...formData, gradeLevel: e.target.value })}
        >
          <option value="">Select grade level</option>
          <option value="9th Grade">9th Grade (Freshman)</option>
          <option value="10th Grade">10th Grade (Sophomore)</option>
          <option value="11th Grade">11th Grade (Junior)</option>
          <option value="12th Grade">12th Grade (Senior)</option>
          <option value="Gap Year">Gap Year</option>
          <option value="Other">Other</option>
        </select>
      </div>

      <div>
        <Label htmlFor="intendedMajor">Intended Major (Optional)</Label>
        <Input
          id="intendedMajor"
          type="text"
          value={formData.intendedMajor}
          onChange={(e) => setFormData({ ...formData, intendedMajor: e.target.value })}
          placeholder="Computer Science, Business, Undecided, etc."
        />
      </div>

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? 'Saving...' : 'Save Changes'}
      </Button>
    </form>
  );
}
