import React from 'react';
import AdminLayout from '@/components/admin/AdminLayout';

const mockUsers = [
  { id: 1, name: 'Admin User', email: 'admin@wista.sg', role: 'Super Admin', status: 'Active', lastLogin: 'Today, 09:41 AM' },
  { id: 2, name: 'Finance Manager', email: 'finance@wista.sg', role: 'Finance Admin', status: 'Active', lastLogin: 'Yesterday, 16:30 PM' },
  { id: 3, name: 'Events Coordinator', email: 'events@wista.sg', role: 'Events Admin', status: 'Active', lastLogin: '2026-09-15 10:15 AM' },
  { id: 4, name: 'Membership Officer', email: 'members@wista.sg', role: 'Membership Admin', status: 'Active', lastLogin: '2026-09-14 11:00 AM' },
  { id: 5, name: 'Comms Intern', email: 'comms@wista.sg', role: 'Communications Admin', status: 'Inactive', lastLogin: '2026-08-01 14:20 PM' }
];

const Users = () => {
  return (
    <AdminLayout>
      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-serif text-ink mb-2">Admin Users</h1>
          <p className="text-ink/70">Manage portal access and roles for WISTA Singapore administrators.</p>
        </div>
        <button className="px-6 py-2 bg-teal text-white rounded-md hover:bg-teal/90 transition-colors font-medium">
          Add New User
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-line overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full data-table">
            <thead>
              <tr className="bg-ivory border-b border-line text-left">
                <th className="p-4 font-medium text-ink/70">User Details</th>
                <th className="p-4 font-medium text-ink/70">Role</th>
                <th className="p-4 font-medium text-ink/70">Status</th>
                <th className="p-4 font-medium text-ink/70">Last Login</th>
                <th className="p-4 font-medium text-ink/70 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {mockUsers.map(user => (
                <tr key={user.id} className="hover:bg-ivory/50">
                  <td className="p-4">
                    <p className="font-medium text-ink">{user.name}</p>
                    <p className="text-sm text-ink/70">{user.email}</p>
                  </td>
                  <td className="p-4">
                    <select 
                      className="text-sm border border-line rounded px-2 py-1 bg-white focus:outline-none focus:border-blue text-ink max-w-[200px]"
                      defaultValue={user.role}
                      disabled={user.role === 'Super Admin' && user.id === 1}
                    >
                      <option value="Super Admin">Super Admin</option>
                      <option value="Membership Admin">Membership Admin</option>
                      <option value="Finance Admin">Finance Admin</option>
                      <option value="Events Admin">Events Admin</option>
                      <option value="Communications Admin">Communications Admin</option>
                    </select>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      user.status === 'Active' ? 'bg-teal/10 text-teal' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-ink/70">{user.lastLogin}</td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-3">
                      {user.role !== 'Super Admin' || user.id !== 1 ? (
                        <>
                          <button className="text-blue text-sm hover:underline">Edit</button>
                          <button className="text-coral text-sm hover:underline">Revoke Access</button>
                        </>
                      ) : (
                        <span className="text-xs text-ink/30 italic">System Required</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
};

export default Users;
