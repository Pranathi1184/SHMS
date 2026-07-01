const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const firstNames = [
  'James', 'Mary', 'Robert', 'Patricia', 'John', 'Jennifer', 'Michael', 'Linda',
  'William', 'Elizabeth', 'David', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica',
  'Thomas', 'Sarah', 'Charles', 'Karen', 'Daniel', 'Nancy', 'Matthew', 'Lisa',
  'Anthony', 'Betty', 'Mark', 'Margaret', 'Donald', 'Sandra', 'Steven', 'Ashley',
  'Paul', 'Kimberly', 'Andrew', 'Emily', 'Joshua', 'Donna', 'Kenneth', 'Michelle',
  'Kevin', 'Dorothy', 'Brian', 'Carol', 'George', 'Amanda', 'Edward', 'Melissa',
  'Ronald', 'Deborah', 'Timothy', 'Stephanie', 'Jason', 'Rebecca', 'Jeffrey', 'Laura',
  'Ryan', 'Sharon', 'Jacob', 'Cynthia', 'Nicholas', 'Kathleen', 'Eric', 'Amy',
  'Jonathan', 'Shirley', 'Larry', 'Angela', 'Justin', 'Helen', 'Brandon', 'Anna',
  'Scott', 'Brenda', 'Benjamin', 'Pamela', 'Samuel', 'Nicole', 'Gregory', 'Emma',
  'Frank', 'Katherine', 'Alexander', 'Christine', 'Raymond', 'Samantha', 'Patrick', 'Debra',
  'Jack', 'Janet', 'Dennis', 'Rachel', 'Jerry', 'Carolyn', 'Tyler', 'Maria',
  'Aaron', 'Heather', 'Henry', 'Diane', 'Douglas', 'Julie', 'Peter', 'Joyce',
  'Jose', 'Victoria', 'Adam', 'Kelly', 'Zachary', 'Christina', 'Nathan', 'Lauren',
  'Walter', 'Joan', 'Harold', 'Evelyn', 'Kyle', 'Judith', 'Carl', 'Megan',
  'Arthur', 'Cheryl', 'Gerald', 'Andrea', 'Roger', 'Hannah', 'Keith', 'Martha',
  'Jeremy', 'Jacqueline', 'Terry', 'Gloria', 'Lawrence', 'Teresa', 'Sean', 'Ann',
  'Christian', 'Sara', 'Austin', 'Kathryn', 'Albert', 'Janice', 'Joe', 'Jean',
  'Willie', 'Alice', 'Ethan', 'Marie', 'Alan', 'Julia', 'Juan', 'Judith',
  'Ryan', 'Nicole', 'Louis', 'Ruby', 'Bruce', 'Grace', 'Gabriel', 'Lillian',
  'Russell', 'Eleanor', 'Ralph', 'Valerie', 'Eugene', 'Danielle', 'Bobby', 'Michele',
  'Philip', 'Beverly', 'Harry', 'Isabella', 'Vincent', 'Annabelle', 'Wayne', 'Charlotte'
];

const lastNames = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
  'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas',
  'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson', 'White',
  'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker', 'Young',
  'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores',
  'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell',
  'Carter', 'Roberts', 'Gomez', 'Phillips', 'Evans', 'Turner', 'Diaz', 'Parker',
  'Cruz', 'Edwards', 'Collins', 'Reyes', 'Stewart', 'Morris', 'Morales', 'Murphy',
  'Cook', 'Rogers', 'Gutierrez', 'Ortiz', 'Morgan', 'Cooper', 'Peterson', 'Bailey',
  'Reed', 'Kelly', 'Howard', 'Ramos', 'Kim', 'Cox', 'Ward', 'Richardson',
  'Watson', 'Brooks', 'Chavez', 'Wood', 'James', 'Bennett', 'Gray', 'Mendoza',
  'Ruiz', 'Hughes', 'Price', 'Alvarez', 'Castillo', 'Sanders', 'Patel', 'Myers',
  'Long', 'Ross', 'Foster', 'Jimenez'
];

const specialtiesByDepartment = {
  'Cardiology': ['Cardiologist', 'Electrophysiologist', 'Interventional Cardiologist', 'Cardiac Surgeon'],
  'Neurology': ['Neurologist', 'Neurosurgeon', 'Pediatric Neurologist'],
  'Orthopedics': ['Orthopedic Surgeon', 'Sports Medicine Specialist', 'Joint Replacement Surgeon', 'Hand Surgeon'],
  'Pediatrics': ['Pediatrician', 'Pediatric Cardiologist', 'Pediatric Neurologist', 'Neonatologist'],
  'Dermatology': ['Dermatologist', 'Cosmetic Dermatologist', 'Pediatric Dermatologist'],
  'Oncology': ['Oncologist', 'Radiation Oncologist', 'Surgical Oncologist'],
  'Emergency': ['Emergency Medicine Physician', 'Trauma Surgeon'],
  'ICU': ['Intensivist', 'Critical Care Specialist'],
  'Radiology': ['Radiologist', 'Interventional Radiologist', 'Nuclear Medicine Specialist'],
  'Laboratory': ['Pathologist', 'Clinical Pathologist', 'Anatomical Pathologist']
};

const medicineData = [
  { name: 'Paracetamol', genericName: 'Acetaminophen', dosageForm: 'Tablet', strength: '500mg', manufacturer: 'PharmaCare', unitPrice: 0.50 },
  { name: 'Ibuprofen', genericName: 'Ibuprofen', dosageForm: 'Tablet', strength: '400mg', manufacturer: 'MedPlus', unitPrice: 0.75 },
  { name: 'Amoxicillin', genericName: 'Amoxicillin Trihydrate', dosageForm: 'Capsule', strength: '500mg', manufacturer: 'BioPharma', unitPrice: 1.20 },
  { name: 'Lisinopril', genericName: 'Lisinopril', dosageForm: 'Tablet', strength: '10mg', manufacturer: 'HeartHealth', unitPrice: 0.90 },
  { name: 'Metformin', genericName: 'Metformin Hydrochloride', dosageForm: 'Tablet', strength: '500mg', manufacturer: 'DiabeticCare', unitPrice: 0.85 },
  { name: 'Omeprazole', genericName: 'Omeprazole', dosageForm: 'Capsule', strength: '20mg', manufacturer: 'DigestHealth', unitPrice: 1.10 },
  { name: 'Atorvastatin', genericName: 'Atorvastatin Calcium', dosageForm: 'Tablet', strength: '20mg', manufacturer: 'CholesterolCare', unitPrice: 1.50 },
  { name: 'Losartan', genericName: 'Losartan Potassium', dosageForm: 'Tablet', strength: '50mg', manufacturer: 'HeartHealth', unitPrice: 1.30 },
  { name: 'Amlodipine', genericName: 'Amlodipine Besylate', dosageForm: 'Tablet', strength: '5mg', manufacturer: 'VitalPharma', unitPrice: 1.00 },
  { name: 'Ventolin', genericName: 'Albuterol', dosageForm: 'Inhaler', strength: '100mcg', manufacturer: 'RespiratoryCare', unitPrice: 25.00 },
  { name: 'Aspirin', genericName: 'Acetylsalicylic Acid', dosageForm: 'Tablet', strength: '81mg', manufacturer: 'PharmaCare', unitPrice: 0.30 },
  { name: 'Ciprofloxacin', genericName: 'Ciprofloxacin Hydrochloride', dosageForm: 'Tablet', strength: '500mg', manufacturer: 'AntiInfect', unitPrice: 2.00 },
  { name: 'Prednisone', genericName: 'Prednisone', dosageForm: 'Tablet', strength: '10mg', manufacturer: 'ImmunoCare', unitPrice: 0.65 },
  { name: 'Sertraline', genericName: 'Sertraline Hydrochloride', dosageForm: 'Tablet', strength: '50mg', manufacturer: 'MentalHealth', unitPrice: 1.40 },
  { name: 'Simvastatin', genericName: 'Simvastatin', dosageForm: 'Tablet', strength: '40mg', manufacturer: 'CholesterolCare', unitPrice: 1.15 }
];

const insuranceProviders = [
  { name: 'HealthFirst', policyNumberPrefix: 'HF-' },
  { name: 'UnitedCare', policyNumberPrefix: 'UC-' },
  { name: 'BlueCross', policyNumberPrefix: 'BC-' },
  { name: 'GlobalHealth', policyNumberPrefix: 'GH-' },
  { name: 'MedSecure', policyNumberPrefix: 'MS-' }
];

const random = (arr) => arr[Math.floor(Math.random() * arr.length)];

const randomNumber = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const randomDate = (start, end) => new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));

const randomPastDate = (years) => randomDate(new Date(Date.now() - years * 365 * 24 * 60 * 60 * 1000), new Date());

const randomFutureDate = (days) => randomDate(new Date(), new Date(Date.now() + days * 24 * 60 * 60 * 1000));

const randomDateOfBirth = (minAge, maxAge) => {
  const today = new Date();
  const birthDate = new Date(
    today.getFullYear() - randomNumber(minAge, maxAge),
    randomNumber(0, 11),
    randomNumber(1, 28)
  );
  return birthDate;
};

const randomPhoneNumber = () => {
  const areaCode = randomNumber(200, 999);
  const prefix = randomNumber(200, 999);
  const line = randomNumber(1000, 9999);
  return `${areaCode}-${prefix}-${line}`;
};

const hashPassword = async (password) => await bcrypt.hash(password, 10);

const generateUser = async (role, index) => {
  const firstName = random(firstNames);
  const lastName = random(lastNames);
  const roleSlug = role.toLowerCase().replace(/\s+/g, '.');
  return {
    id: uuidv4(),
    firstName,
    lastName,
    email: `${roleSlug}.${firstName.toLowerCase()}.${lastName.toLowerCase()}.${index}@shms.com`,
    password: await hashPassword('password123'),
    role,
    phone: randomPhoneNumber(),
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  };
};

const generatePatient = (index = null) => {
  const firstName = random(firstNames);
  const lastName = random(lastNames);
  const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  const genders = ['Male', 'Female', 'Other'];
  const allergies = ['Penicillin', 'Peanuts', 'Latex', 'Aspirin', 'Sulfa drugs', 'None'];

  const dob = randomDateOfBirth(1, 95);
  const insurance = random(insuranceProviders);
  const policyNumber = `${insurance.policyNumberPrefix}${randomNumber(100000, 999999)}`;

  const readableEmail = typeof index === 'number'
    ? `patient.${String(index + 1).padStart(4, '0')}@shms.com`
    : `${firstName.toLowerCase()}.${lastName.toLowerCase()}.${uuidv4().slice(0, 8)}@example.com`;

  return {
    id: uuidv4(),
    firstName,
    lastName,
    email: readableEmail,
    dateOfBirth: dob,
    gender: random(genders),
    phone: randomPhoneNumber(),
    address: `${randomNumber(100, 999)} ${random(['Maple', 'Oak', 'Pine', 'Cedar', 'Elm', 'Walnut'])} St, ${random(['Springfield', 'Riverside', 'Greenville', 'Franklin', 'Clinton'])}, ${random(['CA', 'NY', 'TX', 'FL', 'IL'])} ${randomNumber(10000, 99999)}`,
    bloodType: random(bloodTypes),
    allergies: random(allergies),
    emergencyContactName: `${random(firstNames)} ${random(lastNames)}`,
    emergencyContactPhone: randomPhoneNumber(),
    createdAt: new Date(),
    updatedAt: new Date()
  };
};

const generateMedicine = (index) => {
  const med = medicineData[index % medicineData.length];
  const batchNumber = `${med.manufacturer.substring(0, 3).toUpperCase()}-${randomNumber(10000, 99999)}`;
  const expiryDate = randomDate(new Date(), new Date(Date.now() + 365 * 3 * 24 * 60 * 60 * 1000)); // up to 3 years from now
  const purchaseDate = randomPastDate(2);

  // Vary stock levels: ~10% out of stock, ~15% low stock, rest normal
  const reorderLevel = randomNumber(20, 50);
  let quantity;
  if (index % 10 === 0) {
    quantity = 0; // Out of stock (~10%)
  } else if (index % 7 === 0) {
    quantity = randomNumber(1, reorderLevel); // Low stock (~15%)
  } else {
    quantity = randomNumber(reorderLevel + 1, 500); // In stock
  }

  return {
    id: uuidv4(),
    name: med.name,
    genericName: med.genericName,
    dosageForm: med.dosageForm,
    strength: med.strength,
    manufacturer: med.manufacturer,
    batchNumber,
    expiryDate,
    purchaseDate,
    quantity,
    unitPrice: med.unitPrice,
    reorderLevel,
    createdAt: new Date(),
    updatedAt: new Date()
  };
};

module.exports = {
  firstNames,
  lastNames,
  specialtiesByDepartment,
  medicineData,
  insuranceProviders,
  random,
  randomNumber,
  randomDate,
  randomPastDate,
  randomFutureDate,
  randomDateOfBirth,
  randomPhoneNumber,
  hashPassword,
  generateUser,
  generatePatient,
  generateMedicine
};
