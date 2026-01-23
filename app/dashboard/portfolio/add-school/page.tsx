'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Plus, GraduationCap } from 'lucide-react';

const IVY_SCHOOLS = [
  { name: 'Harvard', edDeadline: '2024-11-01', rdDeadline: '2025-01-01' },
  { name: 'Yale', edDeadline: '2024-11-01', rdDeadline: '2025-01-02' },
  { name: 'Princeton', edDeadline: '2024-11-01', rdDeadline: '2025-01-01' },
  { name: 'Columbia', edDeadline: '2024-11-01', rdDeadline: '2025-01-01' },
  { name: 'UPenn', edDeadline: '2024-11-01', rdDeadline: '2025-01-05' },
  { name: 'Dartmouth', edDeadline: '2024-11-01', rdDeadline: '2025-01-02' },
  { name: 'Brown', edDeadline: '2024-11-01', rdDeadline: '2025-01-05' },
  { name: 'Cornell', edDeadline: '2024-11-01', rdDeadline: '2025-01-02' },
];

const DEADLINE_TYPES = [
  { value: 'EARLY_DECISION', label: 'Early Decision (Binding)' },
  { value: 'EARLY_ACTION', label: 'Early Action' },
  { value: 'RESTRICTIVE_EA', label: 'Restrictive Early Action' },
  { value: 'REGULAR_DECISION', label: 'Regular Decision' },
  { value: 'ROLLING', label: 'Rolling Admissions' },
];

export default function AddSchoolPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    schoolName: '',
    deadlineType: 'REGULAR_DECISION',
    deadline: '',
    notes: '',
  });

  const handleIvySelect = (school: typeof IVY_SCHOOLS[0]) => {
    setFormData({
      ...formData,
      schoolName: school.name,
      deadline: formData.deadlineType.includes('EARLY')
        ? school.edDeadline
        : school.rdDeadline,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/portfolio/schools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Failed to add school');

      router.push('/dashboard/portfolio');
    } catch (error) {
      console.error('Error adding school:', error);
      alert('Failed to add school. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <Link href="/dashboard/portfolio" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
            <ArrowLeft className="w-4 h-4" />
            Back to Portfolio
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="text-3xl font-bold mb-8">Add Target School</h1>

        {/* Quick Add Ivies */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="w-5 h-5" />
              Quick Add: Ivy League
            </CardTitle>
            <CardDescription>
              Click a school to auto-fill with 2024-25 deadlines
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-2">
              {IVY_SCHOOLS.map(school => (
                <button
                  key={school.name}
                  onClick={() => handleIvySelect(school)}
                  className={`p-3 rounded-lg border text-sm font-medium transition-all ${
                    formData.schoolName === school.name
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {school.name}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Manual Form */}
        <Card>
          <CardHeader>
            <CardTitle>School Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="schoolName">School Name *</Label>
                <Input
                  id="schoolName"
                  placeholder="e.g., Stanford, MIT, Northwestern"
                  value={formData.schoolName}
                  onChange={(e) => setFormData({ ...formData, schoolName: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="deadlineType">Deadline Type *</Label>
                <select
                  id="deadlineType"
                  className="w-full px-3 py-2 border rounded-md"
                  value={formData.deadlineType}
                  onChange={(e) => setFormData({ ...formData, deadlineType: e.target.value })}
                >
                  {DEADLINE_TYPES.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="deadline">Deadline Date *</Label>
                <Input
                  id="deadline"
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="notes">Notes (Optional)</Label>
                <textarea
                  id="notes"
                  className="w-full px-3 py-2 border rounded-md min-h-[80px]"
                  placeholder="Any reminders or notes about this application..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? 'Adding...' : 'Add School to Portfolio'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
