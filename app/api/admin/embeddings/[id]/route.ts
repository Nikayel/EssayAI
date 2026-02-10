/**
 * Admin Embeddings Single Item API
 * GET /api/admin/embeddings/[id] - Fetch single item by id (tries all 3 tables)
 * PATCH /api/admin/embeddings/[id] - Update item fields
 * DELETE /api/admin/embeddings/[id] - Delete item
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';

// =============================================================================
// MIDDLEWARE - Check Admin
// =============================================================================

async function checkAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized', status: 401 };
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true },
  });

  if (dbUser?.role !== 'ADMIN') {
    return { error: 'Forbidden - Admin access required', status: 403 };
  }

  return { user };
}

// =============================================================================
// HELPERS - Find item across all 3 tables
// =============================================================================

type TableType = 'example_essay' | 'feedback_pattern' | 'school_insight';

async function findItemById(id: string): Promise<{ item: Record<string, unknown>; type: TableType } | null> {
  // Try ExampleEssay first
  const exampleEssay = await prisma.exampleEssay.findUnique({ where: { id } });
  if (exampleEssay) {
    return { item: exampleEssay as unknown as Record<string, unknown>, type: 'example_essay' };
  }

  // Try FeedbackPattern
  const feedbackPattern = await prisma.feedbackPattern.findUnique({ where: { id } });
  if (feedbackPattern) {
    return { item: feedbackPattern as unknown as Record<string, unknown>, type: 'feedback_pattern' };
  }

  // Try SchoolInsight
  const schoolInsight = await prisma.schoolInsight.findUnique({ where: { id } });
  if (schoolInsight) {
    return { item: schoolInsight as unknown as Record<string, unknown>, type: 'school_insight' };
  }

  return null;
}

// =============================================================================
// GET - Fetch Single Item
// =============================================================================

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await checkAdmin();
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { id } = await params;
    const result = await findItemById(id);

    if (!result) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      type: result.type,
      item: result.item,
    });
  } catch (error) {
    console.error('Failed to fetch embedding item:', error);
    return NextResponse.json({ error: 'Failed to fetch item' }, { status: 500 });
  }
}

// =============================================================================
// PATCH - Update Item
// =============================================================================

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await checkAdmin();
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { id } = await params;
    const body = await request.json();

    // Find the item to determine which table it belongs to
    const result = await findItemById(id);
    if (!result) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    // Remove fields that should not be directly updated
    const { id: _id, createdAt: _createdAt, updatedAt: _updatedAt, ...updateData } = body;

    let updated;

    switch (result.type) {
      case 'example_essay':
        updated = await prisma.exampleEssay.update({
          where: { id },
          data: updateData,
        });
        break;
      case 'feedback_pattern':
        updated = await prisma.feedbackPattern.update({
          where: { id },
          data: updateData,
        });
        break;
      case 'school_insight':
        updated = await prisma.schoolInsight.update({
          where: { id },
          data: updateData,
        });
        break;
    }

    // Log the update
    await prisma.auditLog.create({
      data: {
        userId: auth.user.id,
        action: 'embedding_entry_updated',
        resource: result.type,
        details: { id, fields: Object.keys(updateData) },
      },
    });

    return NextResponse.json({
      success: true,
      type: result.type,
      item: updated,
      message: `${result.type} entry updated successfully.`,
    });
  } catch (error) {
    console.error('Failed to update embedding item:', error);
    return NextResponse.json({ error: 'Failed to update item' }, { status: 500 });
  }
}

// =============================================================================
// DELETE - Delete Item
// =============================================================================

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await checkAdmin();
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { id } = await params;

    // Find the item to determine which table it belongs to
    const result = await findItemById(id);
    if (!result) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    switch (result.type) {
      case 'example_essay':
        await prisma.exampleEssay.delete({ where: { id } });
        break;
      case 'feedback_pattern':
        await prisma.feedbackPattern.delete({ where: { id } });
        break;
      case 'school_insight':
        await prisma.schoolInsight.delete({ where: { id } });
        break;
    }

    // Log the deletion
    await prisma.auditLog.create({
      data: {
        userId: auth.user.id,
        action: 'embedding_entry_deleted',
        resource: result.type,
        details: { id },
      },
    });

    return NextResponse.json({
      success: true,
      message: `${result.type} entry deleted successfully.`,
    });
  } catch (error) {
    console.error('Failed to delete embedding item:', error);
    return NextResponse.json({ error: 'Failed to delete item' }, { status: 500 });
  }
}
