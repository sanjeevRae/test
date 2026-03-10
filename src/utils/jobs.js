import { db } from './firebase';
import { 
  collection, addDoc, updateDoc, deleteDoc, doc, getDocs, 
  query, orderBy, Timestamp
} from 'firebase/firestore';

const JOBS_COLLECTION = 'jobs';

export const createJob = async (jobData) => {
  const now = Timestamp.now();
  const docRef = await addDoc(collection(db, JOBS_COLLECTION), {
    ...jobData,
    status: 'open',
    createdAt: now,
    updatedAt: now,
  });
  return docRef.id;
};

export const updateJob = async (jobId, jobData) => {
  const jobRef = doc(db, JOBS_COLLECTION, jobId);
  await updateDoc(jobRef, {
    ...jobData,
    updatedAt: Timestamp.now(),
  });
};

export const deleteJob = async (jobId) => {
  await deleteDoc(doc(db, JOBS_COLLECTION, jobId));
};

export const toggleJobStatus = async (jobId, currentStatus) => {
  const newStatus = currentStatus === 'open' ? 'closed' : 'open';
  await updateJob(jobId, { status: newStatus });
  return newStatus;
};

export const fetchAllJobs = async () => {
  const q = query(collection(db, JOBS_COLLECTION), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const fetchOpenJobs = async () => {
  // Fetch all jobs then filter client-side to avoid needing a composite index
  const allJobs = await fetchAllJobs();
  return allJobs.filter(job => job.status === 'open');
};
