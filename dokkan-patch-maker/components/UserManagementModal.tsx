import React, { useState, useEffect } from 'react';
import { getAllUsers, updateUserRole, deleteUser } from '../services/userService';
import { User } from '../types';

interface UserManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const UserManagementModal: React.FC<UserManagementModalProps> = ({ isOpen, onClose }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState<string | null>(null); // For fetching users
  const [isLoading, setIsLoading] = useState<boolean>(false); // For fetching users
  const [actionError, setActionError] = useState<string | null>(null); // For errors on specific actions
  const [actionSuccess, setActionSuccess] = useState<string | null>(null); // For success messages on specific actions
  const [isActionLoading, setIsActionLoading] = useState<{[key: number]: boolean}>({}); // UserID-specific loading

  const clearMessages = () => {
    setActionError(null);
    setActionSuccess(null);
  }

  const fetchUsers = async () => {
    setIsLoading(true);
    setError(null);
    clearMessages(); // Clear action messages when refreshing list
    try {
      const fetchedUsers = await getAllUsers();
      setUsers(fetchedUsers);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch users.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
    }
  }, [isOpen]); // Refetch when modal is opened

  const handleRoleChange = async (userId: number, newRole: 'user' | 'admin') => {
    clearMessages();
    setIsActionLoading(prev => ({ ...prev, [userId]: true }));
    try {
      await updateUserRole(userId, newRole);
      setActionSuccess(`User ${userId}'s role updated successfully.`);
      fetchUsers(); // Refresh users list
    } catch (err: any) {
      setActionError(`Failed to update role for user ${userId}: ${err.message}`);
    } finally {
      setIsActionLoading(prev => ({ ...prev, [userId]: false }));
      setTimeout(clearMessages, 3000); // Clear messages after 3s
    }
  };

  const handleDeleteUser = async (userId: number) => {
    clearMessages();
    if (window.confirm(`Are you sure you want to delete user ${userId}?`)) {
      setIsActionLoading(prev => ({ ...prev, [userId]: true }));
      try {
        await deleteUser(userId);
        setActionSuccess(`User ${userId} deleted successfully.`);
        fetchUsers(); // Refresh users list
      } catch (err: any) {
        setActionError(`Failed to delete user ${userId}: ${err.message}`);
      } finally {
        setIsActionLoading(prev => ({ ...prev, [userId]: false }));
        setTimeout(clearMessages, 3000); // Clear messages after 3s
      }
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="modal-backdrop" onClick={onClose} style={{
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
      backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
      justifyContent: 'center', alignItems: 'center'
    }}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{
        background: 'white', padding: '20px', borderRadius: '5px',
        width: '80%', maxWidth: '800px'
      }}>
        <h2>User Management</h2>
        <button onClick={onClose} style={{ float: 'right' }}>Close</button>

        {isLoading && <p>Loading users...</p>}
        {error && <p style={{ color: 'red', textAlign: 'center', marginBottom: '10px' }}>Error fetching users: {error}</p>}
        {actionError && <p style={{ color: 'red', textAlign: 'center', marginBottom: '10px' }}>{actionError}</p>}
        {actionSuccess && <p style={{ color: 'green', textAlign: 'center', marginBottom: '10px' }}>{actionSuccess}</p>}

        {!isLoading && !error && (
          <table style={{width: '100%', borderCollapse: 'collapse'}}>
            <thead>
              <tr style={{borderBottom: '1px solid #ccc'}}>
                <th style={{padding: '8px', textAlign: 'left'}}>ID</th>
                <th style={{padding: '8px', textAlign: 'left'}}>Username</th>
                <th style={{padding: '8px', textAlign: 'left'}}>Email</th>
                <th style={{padding: '8px', textAlign: 'left'}}>Role</th>
                <th style={{padding: '8px', textAlign: 'left'}}>Created At</th>
                <th style={{padding: '8px', textAlign: 'left'}}>Updated At</th>
                <th style={{padding: '8px', textAlign: 'center'}}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} style={{borderBottom: '1px solid #eee'}}>
                  <td style={{padding: '8px'}}>{user.id}</td>
                  <td style={{padding: '8px'}}>{user.username}</td>
                  <td style={{padding: '8px'}}>{user.email}</td>
                  <td style={{padding: '8px'}}>
                    <select
                      value={user.role}
                      onChange={(e) => handleRoleChange(user.id, e.target.value as 'user' | 'admin')}
                      disabled={isActionLoading[user.id]}
                      style={{padding: '4px', borderRadius: '4px'}}
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td style={{padding: '8px'}}>{new Date(user.created_at).toLocaleString()}</td>
                  <td style={{padding: '8px'}}>{new Date(user.updated_at).toLocaleString()}</td>
                  <td style={{padding: '8px', textAlign: 'center'}}>
                    <button 
                      onClick={() => handleDeleteUser(user.id)} 
                      disabled={isActionLoading[user.id]}
                      style={{padding: '4px 8px', background: isActionLoading[user.id] ? '#ccc' : '#ff4d4d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer'}}
                    >
                      {isActionLoading[user.id] ? '...' : 'Delete'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {!isLoading && !error && users.length === 0 && <p style={{textAlign: 'center', marginTop: '20px'}}>No users found.</p>}
      </div>
    </div>
  );
};

export default UserManagementModal;
