import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, User, FileText } from 'lucide-react';

async function getUsers() {
  return await prisma.user.findMany({
    include: {
      profile: true,
      _count: {
        select: {
          essays: true,
          orders: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
}

export default async function AdminUsersPage() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect('/login');
  }

  // Check if user is admin
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
  });

  if (!dbUser || dbUser.role !== 'ADMIN') {
    redirect('/dashboard');
  }

  const users = await getUsers();

  const stats = {
    total: users.length,
    students: users.filter(u => u.role === 'STUDENT').length,
    admins: users.filter(u => u.role === 'ADMIN').length,
    reviewers: users.filter(u => u.role === 'REVIEWER').length,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/admin">
            <Button variant="ghost">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Admin
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">User Management</h1>
          <div className="w-32"></div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-blue-600">Total Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-green-600">Students</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">{stats.students}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-purple-600">Reviewers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">{stats.reviewers}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-orange-600">Admins</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">{stats.admins}</div>
            </CardContent>
          </Card>
        </div>

        {/* Users List */}
        <Card>
          <CardHeader>
            <CardTitle>All Users</CardTitle>
            <CardDescription>View and manage user accounts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {users.map((user) => {
                const userName = user.profile?.name || user.email.split('@')[0];

                return (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                        {userName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{userName}</h3>
                        <p className="text-sm text-gray-600">{user.email}</p>
                        <div className="flex gap-4 mt-1">
                          {user.profile?.gradeLevel && (
                            <span className="text-xs text-gray-500">
                              Grade: {user.profile.gradeLevel}
                            </span>
                          )}
                          {user.profile?.intendedMajor && (
                            <span className="text-xs text-gray-500">
                              Major: {user.profile.intendedMajor}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <FileText className="w-4 h-4" />
                          <span>{user._count.essays} essays</span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {user._count.orders} orders
                        </div>
                      </div>

                      <div className="text-right">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          user.role === 'ADMIN' ? 'bg-orange-100 text-orange-800' :
                          user.role === 'REVIEWER' ? 'bg-purple-100 text-purple-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {user.role}
                        </span>
                        <p className="text-xs text-gray-500 mt-1">
                          Joined {new Date(user.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
