import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const token = req.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      console.error('Unauthorized access attempt to POST /api/links');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload) {
      console.error('Invalid token in POST /api/links');
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { url, title, description, tags } = await req.json();

    console.log('Creating link:', { url, title, description, tags, userId: payload.userId });

    const link = await prisma.link.create({
      data: {
        url,
        title,
        description,
        isPublic: false,
        userId: payload.userId,
        tags: {
          connectOrCreate: tags.map((tag: string) => ({
            where: { name: tag },
            create: { name: tag },
          })),
        },
      },
      include: {
        tags: true,
      },
    });

    return NextResponse.json({ link });
  } catch (error) {
    console.error('Internal server error in POST /api/links:', error, 'DATABASE_URL:', process.env.DATABASE_URL);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const token = req.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      console.error('Unauthorized access attempt to GET /api/links');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload) {
      console.error('Invalid token in GET /api/links');
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const tag = searchParams.get('tag');

    console.log('Fetching links for user:', { userId: payload.userId, tag });

    const where = {
      AND: [
        { userId: payload.userId },
        tag ? { tags: { some: { name: tag } } } : {},
      ],
    };

    const links = await prisma.link.findMany({
      where,
      include: {
        tags: true,
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ links });
  } catch (error) {
    console.error('Internal server error in GET /api/links:', error, 'DATABASE_URL:', process.env.DATABASE_URL);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const token = req.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { id, url, title, description, tags } = await req.json();

    // Verify link ownership
    const existingLink = await prisma.link.findFirst({
      where: { id, userId: payload.userId },
      include: { tags: true }
    });

    if (!existingLink) {
      return NextResponse.json({ error: 'Link not found or unauthorized' }, { status: 404 });
    }

    // Update the link with optimized tag handling
    const updatedLink = await prisma.link.update({
      where: { id },
      data: {
        url,
        title,
        description,
        tags: {
          // First disconnect all existing tags
          disconnect: existingLink.tags.map(tag => ({ name: tag.name })),
          // Then connect or create new tags
          connectOrCreate: tags.map((tag: string) => ({
            where: { name: tag },
            create: { name: tag }
          }))
        }
      },
      include: {
        tags: true
      }
    });

    return NextResponse.json({ link: updatedLink });
  } catch (error) {
    console.error('Error updating link:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const token = req.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Link ID is required' }, { status: 400 });
    }

    // Verify link ownership
    const existingLink = await prisma.link.findFirst({
      where: { id, userId: payload.userId },
    });

    if (!existingLink) {
      return NextResponse.json({ error: 'Link not found or unauthorized' }, { status: 404 });
    }

    await prisma.link.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting link:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}