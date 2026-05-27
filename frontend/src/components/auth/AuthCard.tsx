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
  footerText?: string;
  footerLink?: string;
  footerLabel?: string;
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
        {footerText && footerLink && footerLabel && (
          <CardFooter className="flex flex-col gap-2">
            <div className="text-sm text-muted-foreground">
              {footerText}{' '}
              <Link to={footerLink} className="text-primary hover:underline">
                {footerLabel}
              </Link>
            </div>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
