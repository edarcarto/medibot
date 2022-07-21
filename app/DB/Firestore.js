const { initializeApp, applicationDefault, cert } = require('firebase-admin/app');
const { getFirestore, Timestamp, FieldValue } = require('firebase-admin/firestore');
const moment = require('moment');

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
    const id = parseInt(parameters.fields.serviceId.stringValue);
    const servicesRef = db.collection('doctors').where('serviceId', '==', id);
    const snapshot = await servicesRef.get();
    let dataSet = [];
    if (!snapshot.empty) {
        snapshot.forEach(doc => {
            const node = {
                "title": doc.data().name,
                "image_url": doc.data().url,
                subtitle: `El doctor ${doc.data().name} es ${doc.data().position}`,
                default_action: {
                    type: "web_url",
                    url: doc.data().url,
                    webview_height_ratio: "compact",
                },
                buttons: [
                    {
                        "type": "web_url",
                        "url": doc.data().url,
                        "title": "Ver Imagen"
                    },
                    {
                        type: "postback",
                        title: "Ver horario",
                        payload: doc.data().id
                    }
                ]
            }
            dataSet.push(node);
        });
    }
    return dataSet;
}

async function getDoctorDates(parameters) {
    const id = parameters.fields.doctorId.stringValue;
    const snapshot = await db.collection('doctors').doc(id)
        .collection("schedule").get();
    let dataSet = [];
    if (!snapshot.empty) {
        // create 
        // var payload = 
        snapshot.forEach(doc => {
            dataSet.push({
                content_type: "text",
                title: `📅 ${doc.data().workDate}`,
                payload: JSON.stringify({
                    doctorId: id,
                    scheduleId: doc.data().id
                })
            });
        });
    }
    return dataSet;
}

async function getDoctorHorary(parameters, userId) {
    let queryParams = JSON.parse(parameters.fields.params.stringValue);
    const doctorId = queryParams.doctorId;
    const scheduleId = queryParams.scheduleId;
    // sacar los datos del doctor
    const doctor = await db.collection('doctors').doc(doctorId).get();
    const user = await db.collection('users').doc(userId).get();
    const serviceId = doctor.data().serviceId.toString();
    const service = await db.collection('services').doc(serviceId).get();
    const snapshot = await db.collection('doctors').doc(doctorId)
        .collection("schedule").doc(scheduleId).get();
    const data = snapshot.data();
    let dataSet = [];
    let start = moment(data.start.toDate());
    let end = moment(data.end.toDate());
    console.log("[dataSet]", end.isSame(start));
    let validator = true;
    while (validator) {
        let cpStart = start;
        let end = start.add(30, "minutes");
        start.add(30, "minutes");
        dataSet.push({
            content_type: "text",
            title: `${start.format("hh:mm A")} 🕒`,
            payload: JSON.stringify({
                fullName: `${user.data().firstName} ${user.data().lastName}`,
                start: cpStart,
                end: end,
                doctorName: doctor.data().name,
                serviceName: service.data().name,
                available: true
            })
        });
        if (start.isAfter(end)) {
            validator = false;
        }
    }
    console.log("[dataSet]", dataSet);
    return dataSet;
}

function passQuickReply(params) {
    let queryParams = JSON.parse(params.fields.ticket.stringValue);
    const fullParams = [
        {
            content_type: "text",
            title: "👍 Si",
            payload: queryParams
        },
        {
            content_type: "text",
            title: "⛔ No",
            payload: "NO"
        }
    ];
    return fullParams;
}

async function saveHorary(params) {
    let preBody = JSON.parse(params.fields.ticket.stringValue);
    const body = {...preBody};
    const docRef = await db.collection('reserved').add(body);
    return docRef;
}

module.exports = {
    createUser,
    findUser,
    getCarouselServices,
    getCarouselDoctors,
    getDoctorDates,
    getDoctorHorary,
    passQuickReply,
    saveHorary
};