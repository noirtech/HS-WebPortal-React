/**
 * Unit tests for utility functions
 * Ensures utility functions work correctly and maintain quality
 */

import { 
  hasRole, 
  hasAnyRole, 
  hasPermission,
  isMarinaOnline,
  shouldQueueOperation,
  getOfflineMessage
} from '../utils'

describe('Utility Functions', () => {
  describe('hasRole', () => {
    const mockUser = {
      id: 'user-1',
      email: 'test@example.com',
      roles: [
        { id: 'role-1', role: 'ADMIN', marinaId: 'marina-1' },
        { id: 'role-2', role: 'USER', marinaId: 'marina-2' }
      ]
    }

    it('should return true for user with matching role', () => {
      expect(hasRole(mockUser, 'ADMIN')).toBe(true)
    })

    it('should return false for user without matching role', () => {
      expect(hasRole(mockUser, 'SUPER_ADMIN')).toBe(false)
    })

    it('should return true for marina-specific role', () => {
      expect(hasRole(mockUser, 'USER', 'marina-2')).toBe(true)
    })

    it('should return false for wrong marina', () => {
      expect(hasRole(mockUser, 'USER', 'marina-1')).toBe(false)
    })

    it('should return false for user without roles', () => {
      expect(hasRole({ ...mockUser, roles: [] }, 'ADMIN')).toBe(false)
    })

    it('should return false for null user', () => {
      expect(hasRole(null, 'ADMIN')).toBe(false)
    })
  })

  describe('hasAnyRole', () => {
    const mockUser = {
      id: 'user-1',
      email: 'test@example.com',
      roles: [
        { id: 'role-1', role: 'ADMIN', marinaId: 'marina-1' },
        { id: 'role-2', role: 'USER', marinaId: 'marina-2' }
      ]
    }

    it('should return true for user with any matching role', () => {
      expect(hasAnyRole(mockUser, ['ADMIN', 'SUPER_ADMIN'])).toBe(true)
    })

    it('should return false for user without any matching roles', () => {
      expect(hasAnyRole(mockUser, ['SUPER_ADMIN', 'MODERATOR'])).toBe(false)
    })

    it('should return true for marina-specific role check', () => {
      expect(hasAnyRole(mockUser, ['USER'], 'marina-2')).toBe(true)
    })
  })

  describe('hasPermission', () => {
    const mockUser = {
      id: 'user-1',
      email: 'test@example.com',
      roles: [
        { id: 'role-1', role: 'ADMIN', marinaId: 'marina-1' }
      ],
      permissions: [
        { resource: 'boats', action: 'read', conditions: { marinaId: 'marina-1' } },
        { resource: 'berths', action: 'write', conditions: { marinaId: 'marina-2' } }
      ]
    }

    it('should return true for admin user', () => {
      expect(hasPermission(mockUser, 'any', 'any')).toBe(true)
    })

    it('should return true for specific permission', () => {
      const userWithoutAdmin = { ...mockUser, roles: [] }
      expect(hasPermission(userWithoutAdmin, 'boats', 'read', 'marina-1')).toBe(true)
    })

    it('should return false for wrong marina', () => {
      const userWithoutAdmin = { ...mockUser, roles: [] }
      expect(hasPermission(userWithoutAdmin, 'boats', 'read', 'marina-2')).toBe(false)
    })

    it('should return false for user without permissions', () => {
      const userWithoutPermissions = { ...mockUser, permissions: [] }
      expect(hasPermission(userWithoutPermissions, 'boats', 'read')).toBe(false)
    })
  })

  describe('Marina Status Functions', () => {
    const onlineMarina = { id: 'marina-1', name: 'Online Marina', isOnline: true }
    const offlineMarina = { id: 'marina-2', name: 'Offline Marina', isOnline: false }

    describe('isMarinaOnline', () => {
      it('should return true for online marina', () => {
        expect(isMarinaOnline(onlineMarina)).toBe(true)
      })

      it('should return false for offline marina', () => {
        expect(isMarinaOnline(offlineMarina)).toBe(false)
      })

      it('should return false for null marina', () => {
        expect(isMarinaOnline(null)).toBe(false)
      })

      it('should return false for undefined marina', () => {
        expect(isMarinaOnline(undefined)).toBe(false)
      })
    })

    describe('shouldQueueOperation', () => {
      it('should return false for online marina', () => {
        expect(shouldQueueOperation(onlineMarina)).toBe(false)
      })

      it('should return true for offline marina', () => {
        expect(shouldQueueOperation(offlineMarina)).toBe(true)
      })
    })

    describe('getOfflineMessage', () => {
      it('should return online message for online marina', () => {
        const message = getOfflineMessage(onlineMarina)
        expect(message).toContain('online and operations will be processed immediately')
      })

      it('should return offline message for offline marina', () => {
        const message = getOfflineMessage(offlineMarina)
        expect(message).toContain('Offline Marina is currently offline')
        expect(message).toContain('queued and will be processed')
      })

      it('should handle marina without name', () => {
        const marinaWithoutName = { id: 'marina-3', isOnline: false }
        const message = getOfflineMessage(marinaWithoutName)
        expect(message).toContain('Unknown is currently offline')
      })
    })
  })
})



