require('dotenv').config();
const mongoose = require('mongoose');
const Accessory = require('./models/Accessory');

// [name, printerModel, lastPurchaseDate, tonerCode, location]
const rows = [
  ['Mr. Omar ramay', 'Hp Color laserjet 150a', null, ''],
  ['Mr. Faisal jamil', 'hp color laser jet proMFP M476dw', null, '312A'],
  ['Mr. Harris hafeez', 'hp laser jet printer', null, '48A'],
  ['Mr. Tahir javed', 'hp laser jet pro MfpM280nw', null, '202A'],
  ['4th Floor Back and White', 'NPG-54 Canon Copier iR Advance 6555i', '2021-11-25', 'NPG-54'],
  ['4th floor color new', 'konica 360i', '2022-06-03', 'TN-328'],
  ['Div 8', 'color laser jet enterprise m553', '2022-10-05', '508A'],
  ['MD Room', 'HP LaserJet MFP M280nw', '2022-09-26', '202A'],
  ['ALRG site', 'HP Laser Jet pro MFP M125nw', '2022-01-11', '83A'],
  ['PES Site', '', '2022-02-16', '26A'],
  ['4th Floor Colored (Sent to Karachi)', 'Canon Multifunction machine iR Advance c5535i', '2021-12-01', 'NPG-71', 'karachi'],
  ['5th floor Colored', 'konica 360i', null, ''],
  ['Upper Floor', '', null, ''],
  ['Mr. Shehzada Idress', '', null, ''],
  ['Bushra jadoon', 'Konica C3110', null, ''],
  ['Mr. Shakeel', 'hp laser jet printer 107A', '2022-09-14', '107A'],
  ['Muhammad Sajid', 'P1005', '2022-02-01', '35A'],
  ['Karachi office', 'HP1020 (2 printers)', '2021-12-08', '12A', 'karachi'],
];

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const docs = rows.map(([username, deviceName, shipDate, tonerCode, location], index) => ({
    srfNo: index + 1,
    deviceName: deviceName || 'Not specified',
    deviceType: 'printer',
    username,
    shipDate: shipDate ? new Date(shipDate) : undefined,
    customAccMainU: tonerCode || undefined,
    status: 'assigned',
    location: location || 'islamabad',
  }));
  await Accessory.deleteMany({ deviceType: 'printer' });
  const result = await Accessory.insertMany(docs);
  console.log(`Inserted ${result.length} printer records.`);
  await mongoose.disconnect();
});
