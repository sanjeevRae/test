import React, { useEffect, useState } from 'react';
import { db, auth } from '../utils/firebase';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
// You can use a QR code library like 'qrcode.react' for QR generation
// import QRCode from 'qrcode.react';

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      const usersCol = collection(db, 'profiles');
      const userSnapshot = await getDocs(usersCol);
      const userList = userSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUsers(userList);
      setLoading(false);
    };
    fetchUsers();
  }, []);

  const handleStatusChange = async (uid, status) => {
    await updateDoc(doc(db, 'profiles', uid), { status });
    setUsers(users => users.map(u => u.id === uid ? { ...u, status } : u));
  };

  const handleCategoryChange = async (uid, category) => {
    await updateDoc(doc(db, 'profiles', uid), { category });
    setUsers(users => users.map(u => u.id === uid ? { ...u, category } : u));
  };

  return (
    <div className="admin-dashboard">
      <h2>Admin Dashboard</h2>
      {loading ? <p>Loading users...</p> : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Category</th>
              <th>Status</th>
              <th>Share URL</th>
              <th>QR Code</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id}>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>
                  <select value={user.category || 'Basic'} onChange={e => handleCategoryChange(user.id, e.target.value)}>
                    <option value="Basic">Basic</option>
                    <option value="Premium">Premium</option>
                    <option value="Executive">Executive</option>
                  </select>
                </td>
                <td>
                  <select value={user.status || 'active'} onChange={e => handleStatusChange(user.id, e.target.value)}>
                    <option value="active">Active</option>
                    <option value="blocked">Blocked</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </td>
                <td>
                  <a href={`https://yourdomain.com/card/${user.id}`} target="_blank" rel="noopener noreferrer">Share Link</a>
                </td>
                <td>
                  {/* <QRCode value={`https://yourdomain.com/card/${user.id}`} size={48} /> */}
                  <span>[QR]</span>
                </td>
                <td>
                  {/* Additional admin actions can go here */}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default AdminDashboard;
