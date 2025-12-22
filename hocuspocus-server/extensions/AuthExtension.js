/**
 * Authentication Extension for Hocuspocus
 * 
 * Phase 4: Backend-Authoritative Authentication
 * 
 * Flows:
 * 1. JWT Auth → Check document_shares via backend API
 * 2. Share Link Auth → Validate share_links via backend API
 * 
 * Backend is authoritative. No local role inference.
 */

import jwt from 'jsonwebtoken';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';
const SECRET_KEY = process.env.SECRET_KEY || 'your-secret-key-change-in-production';

/**
 * Create authentication extension
 */
export function createAuthExtension() {
  return {
    /**
     * Authenticate WebSocket connection (PHASE 4)
     * 
     * Two flows:
     * 1. JWT token → Check user role via document_shares
     * 2. Share link token → Validate guest access
     */
    onAuthenticate: async ({ connection, token, documentName, requestHeaders }) => {
      console.log(`🔐 [Phase 4] Authenticating connection for: ${documentName}`);

      // Extract share link token from headers (if present)
      const shareLinkToken = requestHeaders['x-share-token'];

      // =====================================================================
      // FLOW 1: SHARE LINK AUTH (GUEST ACCESS)
      // =====================================================================
      if (shareLinkToken) {
        console.log(`🔗 [Share Link] Validating guest access for: ${documentName}`);
        
        try {
          // Call backend to validate share link
          const response = await fetch(`${BACKEND_URL}/api/v1/share/validate`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              token: shareLinkToken,
              password: null, // TODO: Support password-protected links
            }),
          });

          const validation = await response.json();

          if (!validation.valid) {
            console.error(`❌ [Share Link] Invalid token: ${validation.reason}`);
            throw new Error(`Share link invalid: ${validation.reason}`);
          }

          // Map mode → role
          const roleMap = {
            view: 'viewer',
            comment: 'commenter',
            edit: 'editor',
          };
          const role = roleMap[validation.mode] || 'viewer';

          console.log(`✅ [Share Link] Guest access granted: ${validation.mode} (${role})`);

          return {
            user: {
              id: `guest_${shareLinkToken.slice(0, 8)}`,
              name: 'Guest User',
              email: null,
              role: role,
              authType: 'share_link',
              color: '#94a3b8', // slate-400
            },
          };

        } catch (error) {
          console.error(`❌ [Share Link] Validation failed:`, error.message);
          throw new Error('Unauthorized: Invalid share link');
        }
      }

      // =====================================================================
      // FLOW 2: JWT AUTH (REGISTERED USERS)
      // =====================================================================
      if (!token) {
        console.error(`❌ No authentication provided (no JWT or share link)`);
        throw new Error('Unauthorized: No authentication provided');
      }

      try {
        // Decode JWT (verify signature)
        const decoded = jwt.verify(token, SECRET_KEY);
        console.log(`🔑 [JWT] Token valid for user: ${decoded.email}`);

        // Call backend to check document access
        console.log(`📡 [JWT] Checking document access for: ${documentName}`);
        
        const response = await fetch(`${BACKEND_URL}/api/v1/documents/${documentName}/members`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          if (response.status === 403) {
            console.error(`❌ [JWT] User ${decoded.email} has no access to ${documentName}`);
            throw new Error('Forbidden: No access to document');
          } else if (response.status === 404) {
            console.error(`❌ [JWT] Document not found: ${documentName}`);
            throw new Error('Not found: Document does not exist');
          } else {
            console.error(`❌ [JWT] Backend error: ${response.status}`);
            throw new Error('Authorization check failed');
          }
        }

        const membersData = await response.json();

        // Find user's role in members list
        const userMembership = membersData.members.find(
          m => m.principal_id === decoded.user_id && m.principal_type === 'user'
        );

        if (!userMembership) {
          console.error(`❌ [JWT] User ${decoded.email} not in members list for ${documentName}`);
          throw new Error('Forbidden: Not a member of this document');
        }

        const role = userMembership.role;
        console.log(`✅ [JWT] Access granted: ${decoded.email} → ${documentName} (${role})`);

        return {
          user: {
            id: decoded.user_id,
            name: decoded.name || decoded.email,
            email: decoded.email,
            role: role, // owner | admin | editor | commenter | viewer
            authType: 'jwt',
            color: generateUserColor(decoded.user_id),
          },
        };

      } catch (error) {
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
          console.error(`❌ [JWT] Token invalid or expired:`, error.message);
          throw new Error('Unauthorized: Invalid or expired token');
        }
        
        console.error(`❌ [JWT] Authentication failed:`, error.message);
        throw error; // Re-throw authorization errors
      }
    },

    /**
     * Authorization hook (secondary check)
     * 
     * Note: Primary authorization happens in onAuthenticate via backend.
     * This is a final safety check before document load.
     */
    onLoadDocument: async ({ documentName, context }) => {
      const user = context.user;

      console.log(`🔑 [Phase 4] Final authorization check: ${user.email || user.id} → ${documentName}`);

      // Verify user has a role (should be set by onAuthenticate)
      if (!user.role) {
        console.error(`❌ No role assigned for user: ${user.id}`);
        throw new Error('Authorization failed: No role assigned');
      }

      console.log(`✅ Document load authorized: ${user.email || user.id} (${user.role})`);
    },
  };
}

/**
 * Generate consistent color for user
 */
function generateUserColor(userId) {
  const colors = [
    '#3b82f6', // blue
    '#ef4444', // red
    '#10b981', // green
    '#f59e0b', // amber
    '#8b5cf6', // purple
    '#ec4899', // pink
    '#06b6d4', // cyan
    '#f97316', // orange
  ];

  // Simple hash function
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = ((hash << 5) - hash) + userId.charCodeAt(i);
    hash = hash & hash;
  }

  return colors[Math.abs(hash) % colors.length];
}

