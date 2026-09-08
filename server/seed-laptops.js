require('dotenv').config();
const mongoose = require('mongoose');
const Accessory = require('./models/Accessory');

const MONTHS = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 };

function parseDate(str) {
  if (!str) return null;
  const m = /^(\d{1,2})-([A-Za-z]{3})-(\d{2})$/.exec(str.trim());
  if (!m) return null;
  const day = Number(m[1]);
  const month = MONTHS[m[2]];
  const year = 2000 + Number(m[3]);
  return new Date(year, month, day);
}

// [srfNo, deviceName, displayName, serviceTag, shipDate, expiryDate, customAccMainU, location]
const rows = [
  [1, 'IL400400', 'Hassan Usama 5PK-PM', '1XGNDY3', '22-Sep-23', '11-Oct-27', 'HASSAN', 'islamabad'],
  [2, 'IL401124', 'Ilyas Noreen 5PK-GA', 'D5TTL13', '13-May-20', '14-May-24', 'ILYAS', 'islamabad'],
  [3, 'IL401125', 'Khan Liaqat Ali 5ME1-PK', 'GNPJ4M3', '21-Jan-22', '21-Jan-26', 'ALI_L', 'islamabad'],
  [4, 'IL401502', 'Naseem Moavia', '4Y3NDY3', '22-Sep-23', '11-Oct-27', 'naseeem', 'islamabad'],
  [5, 'IL401130', 'Fahad Muhammad 5PK-PM', 'DYSTL13', '13-May-20', '14-May-24', 'FAHAD', 'islamabad'],
  [7, 'IL401590', 'Rizwan Raja 5PK-OP', 'BSZT1H4', null, null, 'RIZWAN_R', 'islamabad'],
  [9, 'IL401199', 'Bilal Abdul Basit 5ME1-PAK', 'G1HNDY3', '22-Sep-23', '11-Oct-27', 'BILAL', 'islamabad'],
  [10, 'IL401262', 'Shamim Saira 5PK-TS', 'B9NNDY3', '22-Sep-23', '11-Oct-27', 'SHAMIM', 'islamabad'],
  [11, 'IL401531', 'Aleem Saleem', 'DZ3NDY3', '22-Sep-23', '11-Oct-27', 'saleem', 'islamabad'],
  [12, 'IL401296', 'Ashraf Muhammad 5PK-PM', '2BNNDY3', '22-Sep-23', '11-Oct-27', 'ASHRAF', 'islamabad'],
  [13, 'IL401297', 'Shah Fida 5ME1-PK', '4LF34M3', '21-Jan-22', '21-Jan-26', 'HUSSAI_F', 'islamabad'],
  [14, 'IL401298', 'Shakeel Muhammad 5PK-FI', '7S3NDY3', '22-Sep-23', '11-Oct-27', 'SHAKEEL_M', 'islamabad'],
  [15, 'IL401299', 'Qureshi Zeeshan Ahmed 5ME1-PK', 'HV3NDY3', '22-Sep-23', '11-Oct-27', 'QURESHI', 'islamabad'],
  [16, 'IL401578', 'Salman Afzal 5PK-FFI', 'DS3NDY3', '22-Sep-23', '11-Oct-27', 'JAWAD_R', 'islamabad'],
  [18, 'IL401302', 'Mushtaq Atif 5PK-PM', '16D01N2', '27-Mar-18', '28-Mar-22', 'MUSHTA_A', 'islamabad'],
  [19, 'IL401304', 'Butt Adil Anwar 5ME1-PK', 'B2D01N2', '27-Mar-18', '28-Mar-22', 'BUTT_A', 'islamabad'],
  [21, 'IL401321', 'Edris Shahzada 5ME1-PK', 'B2HNDY3', '22-Sep-23', '11-Oct-27', 'EDRIS', 'islamabad'],
  [22, 'IL401536', 'Naeem Muhammad 5PK-TS', 'F15L4M3', '21-Jan-22', '21-Jan-26', 'NAEEM', 'islamabad'],
  [24, 'IL401374', 'Ahmad Sheharyar 5PK-PM', '3GYMDY3', '22-Sep-23', '11-Oct-27', 'AHMAD_SR', 'islamabad'],
  [25, 'IL401375', 'Shakil Rubiya 5ME1-PK', '3MBL4M3', '21-Jan-22', '21-Jan-26', 'SHAKIL_R', 'islamabad'],
  [26, 'IL401380', 'Osman Muhammad 5PK-PM', 'DNBL4M3', '21-Jan-22', '21-Jan-26', 'OSMAN_M', 'islamabad'],
  [28, 'IL401385', 'Shakeel Qaiser', 'Data center', null, null, 'WORKSTATION', 'islamabad'],
  [29, 'IL401396', 'Mudassar Adnan 5PK-TS', 'CNBL4M3', '21-Jan-22', '21-Jan-26', 'MUDASSAR', 'islamabad'],
  [30, 'IL401595', 'Qaiser Shakeel SCANPCIL', 'DQ3NDY3', null, null, 'WORKSTATION', 'islamabad'],
  [32, 'IL401469', 'Riaz Kashif 5ME1-PK', 'HF4ZRC2', '11-Nov-16', '14-Nov-20', 'RIAZ_K', 'islamabad'],
  [33, 'IL401551', 'Ali Haris 5PK', '9V3NDY3', '22-Sep-23', '11-Oct-27', 'ALI_H', 'islamabad'],
  [36, 'IL401473', 'Ramay Omar 5PK-PMTS', '479NDY3', '22-Sep-23', '11-Oct-27', 'RAMAY', 'islamabad'],
  [37, 'IL401474', 'Jamil Faisal 5PK-GA', 'H8NNDY3', '22-Sep-23', '11-Oct-27', 'JAMIL_F', 'islamabad'],
  [38, 'IL401475', 'Qaiser Rana Shakeel 5PK-TS', 'C79NDY3', '22-Sep-23', '11-Oct-27', 'QAISER_S', 'islamabad'],
  [40, 'IL401477', 'Mubeen Hasham Ali 5ME1-PK', 'GRWG573', '26-Oct-20', '28-Oct-24', 'MUBEEN', 'islamabad'],
  [41, 'IL401478', 'Irfan Muhammad 5PK-PM', null, '27-Oct-20', '28-Oct-24', 'IRFAN', 'islamabad'],
  [42, 'IL401535', 'Maqsood Amir 5PK-TS', '9S3NDY3', '22-Sep-23', '11-Oct-27', 'MAQSOOD', 'islamabad'],
  [43, 'IL401484', 'Junaid Muhammad 5ME1-PK', '1P3NDY3', '22-Sep-23', '11-Oct-27', 'JUNAID', 'islamabad'],
  [46, 'KR400963', 'Shakeel Qaiser SCANPCKR', 'Karachi', null, null, 'WORKSTATION', 'karachi'],
  [47, 'KR400942', 'Ahmed Jameel 5PK-GA', '81VZ0N2', '27-Mar-18', '28-Mar-22', 'AHMED_J', 'karachi'],
  [48, 'IL401524', 'Ahmad Munawar', 'C69NDY3', '22-Sep-23', '11-Oct-27', 'Ahmad', 'islamabad'],
  [49, 'KR401015', 'Shafqat Muhammad 5ME1-PK', 'JC4ZRC2', '11-Nov-16', '13-Nov-19', 'shafqa_m', 'karachi'],
  [50, 'IL401522', 'Mobin Muhammad', '58PN473', '26-Oct-20', '28-Oct-24', 'Mobin', 'islamabad'],
  [51, 'IL401495', 'Jadoon Bushra', '6HBL4M3', '21-Jan-22', '21-Jan-26', 'jadoon', 'islamabad'],
  [52, 'IL401493', 'Siddique Muhammad Arslan', 'GW4L4M3', '21-Jan-22', '21-Jan-26', 'siddique', 'islamabad'],
  [53, 'KR401008', 'Khan Mohsin Ahmed 5PK-PM', 'J07T3Z2', '10-Dec-19', '11-Dec-22', 'Khan_mo', 'karachi'],
  [54, 'IL401528', 'Iqbal Hamid 5PK-PM', '1N27HR2', '26-Oct-18', '28-Oct-21', 'iqbal_h', 'islamabad'],
  [55, 'IL401529', 'Bilal Usama 5PK-TS', '7W3NDY3', '22-Sep-23', '11-Oct-27', 'bilal_u', 'islamabad'],
  [56, 'IL401571', 'Sohail Abbas 5PK-PM', '1TGNDY3', '23-Sep-23', '12-Oct-27', 'abbas_s', 'islamabad'],
  [57, 'IL401572', 'Ikram Ullah 5PK-PM', 'FZ4L4M3', null, null, 'ullah_i', 'islamabad'],
  [58, 'IL401559', 'Sajid Fayyaz', 'BN3NDY3', '22-Sep-23', '11-Oct-27', 'fayyaz', 'islamabad'],
  [59, 'IL401580', 'Imran Mujahid', '5VZT1H4', null, null, null, 'islamabad'],
  [60, 'Admin', 'Muhammad Sajid', 'IN27HR2', null, null, null, 'islamabad'],
];

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const docs = rows.map(([, deviceName, displayName, serviceTag, shipDate, expiryDate, customAccMainU, location], index) => ({
    srfNo: index + 1,
    deviceName,
    displayName,
    deviceType: 'laptop',
    serviceTag,
    shipDate: parseDate(shipDate),
    expiryDate: parseDate(expiryDate),
    customAccMainU,
    status: 'available',
    location,
  }));
  await Accessory.deleteMany({ deviceType: 'laptop' });
  const result = await Accessory.insertMany(docs);
  console.log(`Inserted ${result.length} laptop records.`);
  await mongoose.disconnect();
});
