import { NextResponse } from 'next/server';
import { hashPassword, createToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const { email, password, name } = await req.json();
    console.log('Signup attempt:', { email, name });

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      console.error('Email already exists:', { email });
      return NextResponse.json(
        { error: 'Email already exists' },
        { status: 400 }
      );
    }

    const hashedPassword = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
      },
    });

    // Generate token for automatic login
    const token = await createToken({ userId: user.id });

    return NextResponse.json({ 
      token,
      user: { id: user.id, email: user.email, name: user.name }
    });
  } catch (error) {
    console.error('Internal server error in signup route:', error, 'DATABASE_URL:', process.env.DATABASE_URL);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}