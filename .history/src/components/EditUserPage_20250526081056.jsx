import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../utils/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

const EditUserPage = () => {
  const { id } = useParams();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', role: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true);
      setError(null);
      try {
        const userDoc = await getDoc(doc(db, 'users', id));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setUser(data);
          setForm({
            name: data.name || '',
            email: data.email || '',
            role: data.role || 'user',
          });
        } else {
          setError('User not found');
        }
      } catch (err) {
        setError('Failed to load user');
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [id]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await updateDoc(doc(db, 'users', id), {
        name: form.name,
        role: form.role,
      });
      setUser({ ...user, name: form.name, role: form.role });
      alert('User updated successfully!');
    } catch (err) {
      setError('Failed to update user');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{padding: 32}}>Loading...</div>;
  if (error) return <div style={{padding: 32, color: 'red'}}>{error}</div>;
  if (!user) return null;

  return (
    <div style={{ maxWidth: 480, margin: '40px auto', background: '#fff', borderRadius: 12, boxShadow: '0 2px 12px #0001', padding: 32 }}>
      <h2>Edit User</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 18 }}>
          <label>Name:</label>
          <input name="name" value={form.name} onChange={handleChange} required style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #ccc' }} />
        </div>
        <div style={{ marginBottom: 18 }}>
          <label>Email:</label>
          <input name="email" value={form.email} disabled style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #eee', background: '#f8f8f8' }} />
        </div>
        <div style={{ marginBottom: 18 }}>
          <label>Role:</label>
          <select name="role" value={form.role} onChange={handleChange} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #ccc' }}>
            <option value="user">User</option>
            <option value="leader">Leader</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <button type="submit" disabled={saving} style={{ background: '#222', color: '#fff', padding: '10px 24px', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </div>
  );
};

export default EditUserPage;
