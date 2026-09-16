require('dotenv').config();
const mongoose = require('mongoose');
const Accessory = require('./models/Accessory');

// [deviceName/model, serviceTag, username, remark]
const rows = [
  ['Dell 24" Monitor', '42D89K2', 'Kashif Riaz'],
  ['Dell 23" Monitor', '4VY2192', 'Ali Mubeem Hasham'],
  ['Dell 24" Monitor', '28Y90K3', 'Ahmad Munawar', 'given to moavia by munawar'],
  ['Dell 23" Monitor', 'H4D89K2', 'Ahmad Shehryar'],
  ['Dell 23" Monitor', '65D89K2', 'Ahmed Shafqat'],
  ['Dell 23" Monitor', 'JZ9UNM3', 'Jamil Faisal'],
  ['Dell 23" Monitor', '2SY2192', 'Ali Liaqat'],
  ['Dell 19" Monitor', '2B9AOYL', 'Ashraf Muhammad'],
  ['Dell 18" Monitor', 'HP1859M/923FSO', 'Bilal Basit'],
  ['Dell 23" Monitor', '88BVNM3', 'Director'],
  ['Dell 24" Monitor', '12ZVWR2', 'Edris Muhammad'],
  ['Dell 23" Monitor', '2VY2192', 'Hafeez Harris'],
  ['Dell 23" Monitor', 'E2314HF', 'Hasan Haroon'],
  ['Dell 24" Monitor', 'BQX90K3', 'Hussain Aftab', 'given to salman afzal'],
  ['Dell 23" Monitor', '8TY2192', 'Irfan Muhammad'],
  ['Dell 23" Monitor', 'CBBVNM3', 'Shakil Rubiya'],
  ['Dell 23" Monitor', '8Y9VNM3', 'Javed Tahir'],
  ['Dell 24" Monitor', 'HRW90K3 / 8JDRNB2', 'Khan Jazib'],
  ['Dell 24" Monitor', '3Z1WWR2', 'Usama Hassan'],
  ['Dell 23" Monitor', '5TY2192 / 4TY2192', 'Naeem Muhammad'],
  ['Dell 17" Monitor', 'E178FPC', 'LAB'],
  ['Dell 23" Monitor', '6VY2192', 'Qureshi Zeeshan'],
  ['Dell 23" Monitor', '3T9VNM3', 'Ramay Omar'],
  ['Dell 23" Monitor', '3HDBNB2', 'Rizwan Raja'],
  ['Dell 23" Monitor', 'BDBVNM3', 'Sethi Usman'],
  ['Dell 23" Monitor', '2134H-A4AH', 'Shakeel Muhammad'],
  ['Dell 23" Monitor', '35D89K2', 'Shamin Saira'],
  ['Dell 23" Monitor', 'DTY2192', 'Sikander Mueid'],
  ['Dell 23" Monitor', '9TY2132', 'Rizwan Qaiser'],
  ['Dell 17" Monitor', 'E173FPB / 4WX2192', 'Demo Room LCD 1'],
  ['Dell 17" Monitor', 'E173FPH', 'Demo Room LCD 2'],
  ['Dell 17" Monitor', 'E173FPB', 'Server Room'],
  ['HP Secureview 24" Monitor', '', 'Ali Haris'],
  ['Dell 24" Monitor', '', 'Shakeel Qaiser'],
  ['Dell 24" Monitor', '3DY90K3', 'Muhammad Mobin'],
  ['Dell 24" Monitor', 'B2Y90K3', 'Muhammad Shafqat'],
  ['Dell 24" Monitor', 'D2X90K3', 'Fida Hussain'],
  ['Dell 24" Monitor', '78Y90K3', 'Adil Butt'],
  ['Dell 24" Monitor', '', 'Amir Maqsood'],
  ['Dell 24" Monitor', '2BBVNM3', 'Hafiz Muhammad Aleem'],
  ['Dell 24" Monitor', 'DGD36H3 / B5D89K2', 'Bushra khan Jadoon'],
  ['Dell 24" Monitor', '30BVNM3 / 7HNDRB2', 'Muhammad Arslan Siddique'],
  ['Dell 24" Monitor', '4t9VNM3', 'Muhammad Junaid'],
  ['Dell 24" Monitor', 'HCBVNM3', 'Usama Bilal'],
  ['Dell 24" Monitor', 'G4BVNM3', 'Salman Afzal'],
];

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const docs = rows.map(([deviceName, serviceTag, username, remark], index) => ({
    srfNo: index + 1,
    deviceName,
    deviceType: 'lcd',
    serviceTag: serviceTag || undefined,
    username: remark ? `${username} (${remark})` : username,
    status: 'assigned',
    location: 'islamabad',
  }));
  await Accessory.deleteMany({ deviceType: 'lcd' });
  const result = await Accessory.insertMany(docs);
  console.log(`Inserted ${result.length} LCD/monitor records.`);
  await mongoose.disconnect();
});
