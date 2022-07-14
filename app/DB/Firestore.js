const { initializeApp, applicationDefault, cert } = require('firebase-admin/app');
const { getFirestore, Timestamp, FieldValue } = require('firebase-admin/firestore');

const serviceAccount = require('./SA.js');
initializeApp({
    credential: cert(serviceAccount)
});

const db = getFirestore();

async function createUser(params) {
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

async function getCarouselServices() {
    const servicesRef = db.collection('services');
    const snapshot = await servicesRef.get();
    let dataSet = [];
    snapshot.forEach(doc => {
        const node = {
            "title": doc.data().name,
            "image_url": doc.data().url,
            // "subtitle": "We have the right hat for everyone.",
            default_action: {
                type: "postback",
                title: "Elegir",
                payload: doc.data().name
            },
            buttons: [
                {
                    type: "postback",
                    title: "Elegir",
                    payload: doc.data().name
                }
            ]
        }
        dataSet.push(node);
    });
    return dataSet;
}

module.exports = {
    createUser,
    findUser,
    getCarouselServices
};