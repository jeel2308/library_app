import { NextResponse } from 'next/server';
import { comparePasswords, createToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    console.log('Login attempt:', { email });

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      console.error('User not found:', { email });
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    const isValidPassword = await comparePasswords(password, user.password);
    if (!isValidPassword) {
      console.error('Invalid password for user:', { email });
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    const token = await createToken({ userId: user.id });
    
    return NextResponse.json({
      token,
      user: { id: user.id, email: user.email, name: user.name }
    });
  } catch (error) {
    console.error('Internal server error in login route:', error, 'DATABASE_URL:', process.env.DATABASE_URL);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}