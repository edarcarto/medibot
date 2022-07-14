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
            subtitle: `Los doctores en ${doc.data().name} son especialistas en su cargo`,
            default_action: {
                type: "web_url",
                url: doc.data().url,
                webview_height_ratio: "tall",
            },
            buttons: [
                {
                    "type": "web_url",
                    "url": doc.data().url,
                    "title": "Ver Imagen"
                },
                {
                    type: "postback",
                    title: "Elegir",
                    payload: doc.data().id
                }
            ]
        }
        dataSet.push(node);
    });
    return dataSet;
}

async function getCarouselDoctors(parameters) {
    console.log("[getCarouselDoctors]",parameters.fields.serviceId.stringValue)
    const id = parseInt(parameters.fields.serviceId.stringValue);
    const servicesRef = db.collection('doctors').where('serviceId','==',id);
    const snapshot = await servicesRef.get();
    let dataSet = [];
    snapshot.forEach(doc => {
        const node = {
            "title": doc.data().name,
            "image_url": doc.data().url,
            subtitle: `El doctor ${doc.data().name} es ${doc.data().position}`,
            default_action: {
                type: "web_url",
                url: doc.data().url,
                webview_height_ratio: "full",
            },
            buttons: [
                {
                    "type": "web_url",
                    "url": doc.data().url,
                    "title": "Ver Imagen"
                },
                {
                    type: "postback",
                    title: "Elegir",
                    payload: "IDENTIFY_schedules"
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
    getCarouselServices,
    getCarouselDoctors
};