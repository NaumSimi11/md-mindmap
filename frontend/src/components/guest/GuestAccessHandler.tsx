/**
 * Guest Access Handler
 * =====================
 * 
 * Validates share link token and redirects to document.
 * Stores token for Hocuspocus authentication.
 * 
 * Backend is authoritative for validation.
 */

import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { SharesClient } from '@/services/api/sharesClient';
import { AlertCircle, Loader2 } from 'lucide-react';

export const GuestAccessHandler: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = searchParams.get('token');
    const password = searchParams.get('password');

    if (token) {
      validateAndRedirect(token, password);
    } else {
      setError('No share token provided');
    }
  }, [searchParams]);

  const validateAndRedirect = async (token: string, password: string | null) => {
    setValidating(true);
    setError(null);

    try {
      // Validate share link via backend
      const validation = await SharesClient.validateShareLink(token, password);

      if (!validation.valid) {
        setError(getErrorMessage(validation.reason));
        setValidating(false);
        return;
      }

      // Store share token for Hocuspocus
      sessionStorage.setItem('share_token', token);
      sessionStorage.setItem('share_mode', validation.mode!);
      sessionStorage.setItem('document_id', validation.document_id!);

      // Redirect to document
      navigate(`/workspace/doc/${validation.document_id}/edit`);
    } catch (err) {
      setError((err as Error).message);
      setValidating(false);
    }
  };

  const getErrorMessage = (reason: string | null): string => {
    switch (reason) {
      case 'expired':
        return 'This share link has expired.';
      case 'revoked':
        return 'This share link has been revoked.';
      case 'max_uses_exceeded':
        return 'This share link has reached its maximum number of uses.';
      case 'password_required':
        return 'This share link requires a password.';
      case 'invalid_password':
        return 'Incorrect password.';
      case 'invalid_token':
        return 'Invalid share link.';
      default:
        return 'Failed to access document.';
    }
  };

  if (validating) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin mx-auto text-primary" />
          <p className="text-lg font-medium">Validating share link...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="max-w-md p-6 border rounded-lg space-y-4">
          <div className="flex items-center gap-3 text-destructive">
            <AlertCircle className="w-8 h-8" />
            <h2 className="text-xl font-semibold">Access Denied</h2>
          </div>
          <p>{error}</p>
          <button
            onClick={() => navigate('/')}
            className="w-full py-2 px-4 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  return null;
};

