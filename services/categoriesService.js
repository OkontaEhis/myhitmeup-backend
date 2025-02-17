import { getFirestore } from "firebase-admin/firestore";

const db = getFirestore();

export async function createCategory(categoriesId, name, description) {
  const categoryRef = db.collection('categories').doc(categoriesId);
  await categoryRef.set({
    id: categoriesId,
    name,
    description,
    createdAt: new Date().toISOString()
  });
  console.log("Category created successfully!");
}
export async function createChatterroom(name, categoryId, createdBy) {
    const chatterroomRef = db.collection('chatterrooms').doc();
    await chatterroomRef.set({
      id: chatterroomRef.id,
      name,
      categoryId,
      createdBy,
      createdAt: new Date().toISOString()
    });
    console.log("Chatterroom created successfully!");
  }
export async function addMessage(chatterroomId, senderId, content) {
    const messageRef = db.collection('chatterrooms')
                         .doc(chatterroomId)
                         .collection('messages')
                         .doc();
    await messageRef.set({
      id: messageRef.id,
      senderId,
      content,
      timestamp: new Date().toISOString()
    });
    console.log("Message sent!");
  }
export async function updateUserRewards(rewardsId, points, badge) {
    const userRewardsRef = db.collection('user_rewards').doc(rewardsId);
    const userDoc = await userRewardsRef.get();
  
    if (userDoc.exists) {
      const data = userDoc.data();
      await userRewardsRef.update({
        points: (data.points || 0) + points,
        badges: Array.from(new Set([...(data.badges || []), badge])),
        lastUpdated: new Date().toISOString()
      });
    } else {
      await userRewardsRef.set({
        rewardsId,
        points,
        badges: [badge],
        lastUpdated: new Date().toISOString()
      });
    }
    console.log("Rewards updated!");
  }
