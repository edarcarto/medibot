const { initializeApp, applicationDefault, cert } = require('firebase-admin/app');
const { getFirestore, Timestamp, FieldValue } = require('firebase-admin/firestore');

const serviceAccount = require('./SA.js');
initializeApp({
    credential: cert(serviceAccount)
});

const db = getFirestore();

async function createUser (params) {
    const docRef = db.collection('users').doc(params.facebookId);

    await docRef.set({
        firstName: params.firstName,
        lastName: params.lastName,
        facebookId: params.facebookId,
        profilePic: params.profilePic
    });

    return docRef;
}

async function findUser(params) {
    const userRef = db.collection('users').doc(params.facebookId);
    const doc = await userRef.get();
    if (!doc.exists) {
        console.log('No such document!');
        return false;
    } else {
        console.log('Document data:', doc.data());
        return doc.data();
    }
}

module.exports = {
    createUser,
    findUser
};