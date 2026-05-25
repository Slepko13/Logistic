import React from 'react';
import { Link } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export interface AuthCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footerText: string;
  footerLink: string;
  footerLabel: string;
}

export default function AuthCard({
  title,
  subtitle,
  children,
  footerText,
  footerLink,
  footerLabel,
}: AuthCardProps) {
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">{title}</CardTitle>
          {subtitle && <CardDescription>{subtitle}</CardDescription>}
        </CardHeader>
        <CardContent>{children}</CardContent>
        <CardFooter className="justify-center border-t pt-6">
          <p className="text-sm text-muted-foreground">
            {footerText}{' '}
            <Link to={footerLink} className="font-medium text-primary hover:underline">
              {footerLabel}
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
