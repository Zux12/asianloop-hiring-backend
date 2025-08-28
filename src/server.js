require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');

const { connectDB } = require('./utils/db');
const User = require('./models/User');

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.get('/api/health', (req, res) => {
  res.json({ ok: true, service: 'asianloop-hiring-api', ts: new Date().toISOString() });
});

app.use('/api/auth', require('./routes/auth'));

(async () => {
  try {
    const uri = process.env.MONGO_URI;
    if (!uri) {
      console.error('❌ Missing MONGO_URI in env');
      process.exit(1);
    }
    await connectDB(uri);

    // Seed admin user (idempotent)
    const adminEmail = 'admin@gmail.com';
    let admin = await User.findOne({ email: adminEmail });
    if (!admin) {
      admin = new User({ name: 'Admin', email: adminEmail, role: 'admin' });
      await admin.setPassword('admin123'); // change later in production
      await admin.save();
      console.log('👤 Seeded admin:', adminEmail, '(password: admin123)');
    }

    const port = process.env.PORT || 4000;
    app.listen(port, () => console.log(`🚀 API listening on :${port}`));
  } catch (err) {
    console.error('Startup error:', err);
    process.exit(1);
  }
})();
