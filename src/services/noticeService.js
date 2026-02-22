import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase';

const noticeService = {
  async getNotices(spaceId) {
    const q = query(
      collection(db, `spaces/${spaceId}/notices`),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({
      id: d.id,
      ...d.data(),
      createdAt: d.data().createdAt?.toDate?.() || new Date(),
    }));
  },

  async addNotice(spaceId, { title, content, link }, userId, userName) {
    const ref = collection(db, `spaces/${spaceId}/notices`);
    const docRef = await addDoc(ref, {
      title,
      content: content || '',
      link: link || '',
      createdAt: new Date(),
      createdBy: userId,
      createdByName: userName,
    });
    return docRef.id;
  },

  async updateNotice(spaceId, noticeId, { title, content, link }) {
    const ref = doc(db, `spaces/${spaceId}/notices`, noticeId);
    await updateDoc(ref, {
      title,
      content: content || '',
      link: link || '',
      updatedAt: new Date(),
    });
  },

  async deleteNotice(spaceId, noticeId) {
    await deleteDoc(doc(db, `spaces/${spaceId}/notices`, noticeId));
  },
};

export default noticeService;
