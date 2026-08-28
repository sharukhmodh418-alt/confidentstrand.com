require('dotenv').config();
const dns = require('dns');
// Set DNS servers to Google's public DNS to avoid ECONNREFUSED/resolution issues with MongoDB Atlas SRV records
dns.setServers(['8.8.8.8', '8.8.4.4']);

const express = require('express');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');
const fs = require('fs').promises;

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS for frontend requests
app.use(cors());

// Parse JSON request bodies (increased limit for image base64 previews)
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ limit: '25mb', extended: true }));

// Serve static frontend files
app.use(express.static(path.join(__dirname)));

// Establish MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI;

if (MONGODB_URI) {
    mongoose.connect(MONGODB_URI)
        .then(() => console.log('Connected to MongoDB Atlas successfully.'))
        .catch(err => {
            console.error('MongoDB connection error:', err);
        });
} else {
    console.error('CRITICAL: MONGODB_URI is not defined in environment variables.');
    process.exit(1);
}

// ==================== MONGOOSE SCHEMAS & MODELS ====================

const submissionSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    type: { type: String, default: 'Consultation', enum: ['Consultation', 'Quiz'] },
    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: String,
    dob: String,
    hairloss: String,
    message: String,
    score: String,
    answers: {
        step1: String,
        step2: String,
        step3: String
    },
    status: { type: String, default: 'New', enum: ['New', 'Contacted', 'Booked', 'Completed', 'Declined'] },
    notes: { type: String, default: '' },
    timestamp: { type: Date, default: Date.now }
});

const bookingSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    phone: { type: String, required: true },
    service: { type: String, required: true },
    date: { type: String, required: true },
    time: { type: String, required: true },
    stylist: { type: String, default: '' },
    notes: { type: String, default: '' },
    status: { type: String, default: 'Pending', enum: ['Pending', 'Confirmed', 'Completed', 'Cancelled'] },
    duration: { type: String, default: '30 mins' },
    price: { type: Number, default: 0 },
    timestamp: { type: Date, default: Date.now }
});

const partnerConfigSchema = new mongoose.Schema({
    stylist: { type: String, required: true, unique: true },
    salonShare: { type: Number, default: 70 },
    services: { type: Array, default: [] }
});

const serviceSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    duration: { type: String, default: '30 mins' },
    description: String
});

const paymentSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    customer: { type: String, required: true },
    service: { type: String, required: true },
    amount: { type: Number, required: true },
    method: { type: String, default: 'Cash', enum: ['Cash', 'Card', 'Bank Transfer'] },
    status: { type: String, default: 'Paid', enum: ['Paid', 'Pending', 'Refunded'] },
    timestamp: { type: Date, default: Date.now }
});

const settingSchema = new mongoose.Schema({
    clinicName: { type: String, default: "Confident Strands Studio" },
    whatsappNumber: { type: String, default: "971523002576" },
    currency: { type: String, default: "AED" },
    workingHours: { type: String, default: "Sat - Thu: 10AM - 9PM" }
});

const Submission = mongoose.model('Submission', submissionSchema);
const Booking = mongoose.model('Booking', bookingSchema);
const Service = mongoose.model('Service', serviceSchema);
const Payment = mongoose.model('Payment', paymentSchema);
const Setting = mongoose.model('Setting', settingSchema);
const PartnerConfig = mongoose.model('PartnerConfig', partnerConfigSchema);

const userSchema = new mongoose.Schema({
    uid: { type: String, required: true, unique: true },
    email: { type: String, required: true },
    role: { type: String, required: true, enum: ['admin', 'partner'] },
    partnerName: { type: String, default: '' },
    timestamp: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

// ==================== HYBRID LOCAL JSON / MONGODB HELPER FUNCTIONS ====================

// Helper to check if MongoDB is active and connected
const isMongoConnected = () => mongoose.connection.readyState === 1;

// Helper to read local JSON file
async function readJsonFile(filename, defaultValue = []) {
    try {
        const filePath = path.join(__dirname, filename);
        const data = await fs.readFile(filePath, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        console.warn(`Warning: Could not read local file ${filename}, using default value.`);
        return defaultValue;
    }
}

// Helper to write local JSON file
async function writeJsonFile(filename, data) {
    try {
        const filePath = path.join(__dirname, filename);
        await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
        return true;
    } catch (err) {
        console.error(`Error writing to local file ${filename}:`, err);
        return false;
    }
}

// --- Submissions helpers ---
async function getSubmissions() {
    if (isMongoConnected()) {
        try {
            return await Submission.find({});
        } catch (err) {
            console.error('MongoDB read error, falling back to local file:', err);
        }
    }
    return await readJsonFile('submissions.json');
}

async function saveSubmission(data) {
    if (isMongoConnected()) {
        try {
            const submission = new Submission(data);
            return await submission.save();
        } catch (err) {
            console.error('MongoDB write error, falling back to local file:', err);
        }
    }
    const submissions = await readJsonFile('submissions.json');
    submissions.push(data);
    await writeJsonFile('submissions.json', submissions);
    return data;
}

async function updateSubmission(id, updateData) {
    if (isMongoConnected()) {
        try {
            return await Submission.findOneAndUpdate(
                { id: id },
                { $set: updateData },
                { new: true }
            );
        } catch (err) {
            console.error('MongoDB update error, falling back to local file:', err);
        }
    }
    const submissions = await readJsonFile('submissions.json');
    const index = submissions.findIndex(s => s.id === id);
    if (index === -1) return null;
    submissions[index] = { ...submissions[index], ...updateData };
    await writeJsonFile('submissions.json', submissions);
    return submissions[index];
}

async function deleteSubmission(id) {
    if (isMongoConnected()) {
        try {
            return await Submission.findOneAndDelete({ id: id });
        } catch (err) {
            console.error('MongoDB delete error, falling back to local file:', err);
        }
    }
    const submissions = await readJsonFile('submissions.json');
    const index = submissions.findIndex(s => s.id === id);
    if (index === -1) return null;
    const deleted = submissions.splice(index, 1)[0];
    await writeJsonFile('submissions.json', submissions);
    return deleted;
}

// --- Bookings helpers ---
async function getBookings() {
    if (isMongoConnected()) {
        try {
            return await Booking.find({});
        } catch (err) {
            console.error('MongoDB read error, falling back to local file:', err);
        }
    }
    return await readJsonFile('bookings.json');
}

async function saveBooking(data) {
    if (isMongoConnected()) {
        try {
            const booking = new Booking(data);
            return await booking.save();
        } catch (err) {
            console.error('MongoDB write error, falling back to local file:', err);
        }
    }
    const bookings = await readJsonFile('bookings.json');
    bookings.push(data);
    await writeJsonFile('bookings.json', bookings);
    return data;
}

async function updateBooking(id, updateData) {
    if (isMongoConnected()) {
        try {
            return await Booking.findOneAndUpdate(
                { id: id },
                { $set: updateData },
                { new: true }
            );
        } catch (err) {
            console.error('MongoDB update error, falling back to local file:', err);
        }
    }
    const bookings = await readJsonFile('bookings.json');
    const index = bookings.findIndex(b => b.id === id);
    if (index === -1) return null;
    bookings[index] = { ...bookings[index], ...updateData };
    await writeJsonFile('bookings.json', bookings);
    return bookings[index];
}

async function deleteBooking(id) {
    if (isMongoConnected()) {
        try {
            return await Booking.findOneAndDelete({ id: id });
        } catch (err) {
            console.error('MongoDB delete error, falling back to local file:', err);
        }
    }
    const bookings = await readJsonFile('bookings.json');
    const index = bookings.findIndex(b => b.id === id);
    if (index === -1) return null;
    const deleted = bookings.splice(index, 1)[0];
    await writeJsonFile('bookings.json', bookings);
    return deleted;
}

// --- Services helpers ---
async function getServices() {
    if (isMongoConnected()) {
        try {
            return await Service.find({});
        } catch (err) {
            console.error('MongoDB read error, falling back to local file:', err);
        }
    }
    return await readJsonFile('services.json');
}

async function saveService(data) {
    if (isMongoConnected()) {
        try {
            const service = new Service(data);
            return await service.save();
        } catch (err) {
            console.error('MongoDB write error, falling back to local file:', err);
        }
    }
    const services = await readJsonFile('services.json');
    services.push(data);
    await writeJsonFile('services.json', services);
    return data;
}

async function updateService(id, updateData) {
    if (isMongoConnected()) {
        try {
            return await Service.findOneAndUpdate(
                { id: id },
                { $set: updateData },
                { new: true }
            );
        } catch (err) {
            console.error('MongoDB update error, falling back to local file:', err);
        }
    }
    const services = await readJsonFile('services.json');
    const index = services.findIndex(s => s.id === id);
    if (index === -1) return null;
    services[index] = { ...services[index], ...updateData };
    await writeJsonFile('services.json', services);
    return services[index];
}

async function deleteService(id) {
    if (isMongoConnected()) {
        try {
            return await Service.findOneAndDelete({ id: id });
        } catch (err) {
            console.error('MongoDB delete error, falling back to local file:', err);
        }
    }
    const services = await readJsonFile('services.json');
    const index = services.findIndex(s => s.id === id);
    if (index === -1) return null;
    const deleted = services.splice(index, 1)[0];
    await writeJsonFile('services.json', services);
    return deleted;
}

// --- Payments helpers ---
async function getPayments() {
    if (isMongoConnected()) {
        try {
            return await Payment.find({});
        } catch (err) {
            console.error('MongoDB read error, falling back to local file:', err);
        }
    }
    return await readJsonFile('payments.json');
}

async function savePayment(data) {
    if (isMongoConnected()) {
        try {
            const payment = new Payment(data);
            return await payment.save();
        } catch (err) {
            console.error('MongoDB write error, falling back to local file:', err);
        }
    }
    const payments = await readJsonFile('payments.json');
    payments.push(data);
    await writeJsonFile('payments.json', payments);
    return data;
}

async function updatePayment(id, updateData) {
    if (isMongoConnected()) {
        try {
            return await Payment.findOneAndUpdate(
                { id: id },
                { $set: updateData },
                { new: true }
            );
        } catch (err) {
            console.error('MongoDB update error, falling back to local file:', err);
        }
    }
    const payments = await readJsonFile('payments.json');
    const index = payments.findIndex(p => p.id === id);
    if (index === -1) return null;
    payments[index] = { ...payments[index], ...updateData };
    await writeJsonFile('payments.json', payments);
    return payments[index];
}

async function deletePayment(id) {
    if (isMongoConnected()) {
        try {
            return await Payment.findOneAndDelete({ id: id });
        } catch (err) {
            console.error('MongoDB delete error, falling back to local file:', err);
        }
    }
    const payments = await readJsonFile('payments.json');
    const index = payments.findIndex(p => p.id === id);
    if (index === -1) return null;
    const deleted = payments.splice(index, 1)[0];
    await writeJsonFile('payments.json', payments);
    return deleted;
}

// --- Settings helpers ---
async function getSettings() {
    if (isMongoConnected()) {
        try {
            let settings = await Setting.findOne({});
            if (!settings) {
                settings = new Setting({
                    clinicName: "Confident Strands Studio",
                    whatsappNumber: "971523002576",
                    currency: "AED",
                    workingHours: "Sat - Thu: 10AM - 9PM"
                });
                await settings.save();
            }
            return settings;
        } catch (err) {
            console.error('MongoDB read settings error, falling back to local file:', err);
        }
    }
    const settingsList = await readJsonFile('settings.json', {});
    if (!settingsList || Object.keys(settingsList).length === 0 || !settingsList.clinicName) {
        const defaultSettings = {
            clinicName: "Confident Strands Studio",
            whatsappNumber: "971523002576",
            currency: "AED",
            workingHours: "Sat - Thu: 10AM - 9PM"
        };
        await writeJsonFile('settings.json', defaultSettings);
        return defaultSettings;
    }
    return Array.isArray(settingsList) ? settingsList[0] : settingsList;
}

async function updateSettings(updateData) {
    if (isMongoConnected()) {
        try {
            return await Setting.findOneAndUpdate(
                {},
                { $set: updateData },
                { upsert: true, new: true }
            );
        } catch (err) {
            console.error('MongoDB write settings error, falling back to local file:', err);
        }
    }
    const currentSettings = await getSettings();
    const newSettings = { ...currentSettings, ...updateData };
    await writeJsonFile('settings.json', newSettings);
    return newSettings;
}

// --- Partner Config helpers ---
async function getPartnerConfig(stylist) {
    if (isMongoConnected()) {
        try {
            let config = await PartnerConfig.findOne({ stylist });
            if (!config) {
                config = new PartnerConfig({ stylist, salonShare: 70, services: [] });
                await config.save();
            }
            return config;
        } catch (err) {
            console.error('MongoDB read partner config error, falling back to local file:', err);
        }
    }
    const configs = await readJsonFile('partnerConfig.json', []);
    let config = configs.find(c => c.stylist === stylist);
    if (!config) {
        config = { stylist, salonShare: 70, services: [] };
        configs.push(config);
        await writeJsonFile('partnerConfig.json', configs);
    }
    return config;
}

async function updatePartnerConfig(stylist, updateData) {
    if (isMongoConnected()) {
        try {
            return await PartnerConfig.findOneAndUpdate(
                { stylist },
                { $set: updateData },
                { upsert: true, new: true }
            );
        } catch (err) {
            console.error('MongoDB write partner config error, falling back to local file:', err);
        }
    }
    const configs = await readJsonFile('partnerConfig.json', []);
    let index = configs.findIndex(c => c.stylist === stylist);
    let newConfig = { stylist, salonShare: 70, services: [], ...updateData };
    if (index === -1) {
        configs.push(newConfig);
    } else {
        configs[index] = { ...configs[index], ...updateData };
        newConfig = configs[index];
    }
    await writeJsonFile('partnerConfig.json', configs);
    return newConfig;
}

// --- User helpers ---
async function getUsers() {
    if (isMongoConnected()) {
        try {
            return await User.find({});
        } catch (err) {
            console.error('MongoDB read users error, falling back to local file:', err);
        }
    }
    return await readJsonFile('users.json', []);
}

async function saveUser(data) {
    if (isMongoConnected()) {
        try {
            const user = new User(data);
            return await user.save();
        } catch (err) {
            console.error('MongoDB write user error, falling back to local file:', err);
        }
    }
    const users = await readJsonFile('users.json', []);
    users.push(data);
    await writeJsonFile('users.json', users);
    return data;
}

async function findUserByUid(uid) {
    if (isMongoConnected()) {
        try {
            return await User.findOne({ uid: uid });
        } catch (err) {
            console.error('MongoDB find user error, falling back to local file:', err);
        }
    }
    const users = await readJsonFile('users.json', []);
    return users.find(u => u.uid === uid) || null;
}

// ==================== AI HAIR PATCH PREVIEW WEBHOOK PROXY ====================
app.post('/api/ai-hair-preview', async (req, res) => {
    try {
        const { image, fileName, fileType, fileSize, style, color } = req.body;

        if (!image) {
            return res.status(400).json({
                success: false,
                error: 'No photo provided for AI preview.'
            });
        }

        const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL || 'http://localhost:5678/webhook-test/hair-patch-preview';
        console.log(`[AI Preview] Forwarding photo to n8n webhook: ${n8nWebhookUrl}`);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout for AI processing

        try {
            const n8nResponse = await fetch(n8nWebhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    image,
                    fileName: fileName || 'photo.jpg',
                    fileType: fileType || 'image/jpeg',
                    fileSize: fileSize || 0,
                    style: style || 'Natural Wave',
                    color: color || 'Natural Black',
                    timestamp: new Date().toISOString()
                }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);
            const contentType = n8nResponse.headers.get('content-type') || '';

            if (n8nResponse.ok) {
                if (contentType.includes('application/json')) {
                    const data = await n8nResponse.json();
                    return res.json({
                        success: true,
                        source: 'n8n_json',
                        resultImage: data.resultImage || data.output_image_url || data.outputImage || data.url || data.image || image,
                        beforeImage: image,
                        message: 'AI Preview generated successfully via n8n!',
                        data: data
                    });
                } else if (contentType.includes('image/')) {
                    const arrayBuffer = await n8nResponse.arrayBuffer();
                    const base64 = Buffer.from(arrayBuffer).toString('base64');
                    const mime = contentType.split(';')[0] || 'image/png';
                    const dataUrl = `data:${mime};base64,${base64}`;
                    return res.json({
                        success: true,
                        source: 'n8n_binary',
                        resultImage: dataUrl,
                        beforeImage: image,
                        message: 'AI Preview generated successfully via n8n!'
                    });
                } else {
                    const text = await n8nResponse.text();
                    let parsed;
                    try { parsed = JSON.parse(text); } catch (e) {}
                    return res.json({
                        success: true,
                        source: 'n8n_text',
                        resultImage: (parsed && (parsed.resultImage || parsed.output_image_url)) ? (parsed.resultImage || parsed.output_image_url) : image,
                        beforeImage: image,
                        message: 'AI Preview generated successfully via n8n!'
                    });
                }
            } else {
                console.warn(`[AI Preview] n8n webhook responded with HTTP ${n8nResponse.status}`);
            }
        } catch (fetchErr) {
            clearTimeout(timeoutId);
            console.warn('[AI Preview] Could not reach n8n webhook (workflow offline or test webhook idle):', fetchErr.message);
        }

        // Graceful fallback response if n8n test webhook is offline
        return res.json({
            success: true,
            source: 'fallback',
            resultImage: image,
            beforeImage: image,
            message: 'Preview generated successfully (Fallback mode - n8n webhook offline or test endpoint waiting).'
        });

    } catch (err) {
        console.error('[AI Preview] Error processing preview:', err);
        return res.status(500).json({
            success: false,
            error: 'Failed to generate preview.'
        });
    }
});

// ==================== SUBMISSIONS API ENDPOINTS ====================

// POST Endpoint to save submissions (both lead form and quiz)
app.post('/api/submissions', async (req, res) => {
    const { type, name, phone, email, dob, hairloss, message, score, answers } = req.body;

    // Validation
    if (!name || name.trim() === '') {
        return res.status(400).json({
            success: false,
            error: 'Name is required.'
        });
    }

    if (!phone || phone.trim() === '') {
        return res.status(400).json({
            success: false,
            error: 'Phone number is required.'
        });
    }

    // Prepare data based on submission type
    const submissionData = {
        id: Date.now().toString(36) + Math.random().toString(36).substring(2, 7),
        type: type || 'Consultation',
        name: name.trim(),
        phone: phone.trim(),
        timestamp: new Date().toISOString()
    };

    if (submissionData.type === 'Consultation') {
        submissionData.email = email ? email.trim() : '';
        submissionData.dob = dob || '';
        submissionData.hairloss = hairloss || '';
        submissionData.message = message ? message.trim() : '';
    } else if (submissionData.type === 'Quiz') {
        submissionData.score = score || '95';
        submissionData.answers = answers || {};
    }

    try {
        await saveSubmission(submissionData);
        console.log(`Saved submission: Type: "${submissionData.type}", Name: "${submissionData.name}"`);

        // Forward to Google Sheets if configured
        if (process.env.GOOGLE_SHEETS_URL) {
            // Flatten the submission data for Google Sheets ingestion
            const flatData = {
                id: submissionData.id,
                timestamp: submissionData.timestamp,
                type: submissionData.type,
                name: submissionData.name,
                phone: submissionData.phone,
                email: submissionData.email || '',
                dob: submissionData.dob || '',
                hairloss: submissionData.hairloss || '',
                message: submissionData.message || '',
                score: submissionData.score || '',
                step1: submissionData.answers?.step1 || '',
                step2: submissionData.answers?.step2 || '',
                step3: submissionData.answers?.step3 || ''
            };

            fetch(process.env.GOOGLE_SHEETS_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(flatData)
            })
            .then(async (response) => {
                const responseText = await response.text();
                console.log(`Google Sheets response (Status ${response.status}):`, responseText);
                if (!response.ok) {
                    console.error('Google Sheets forwarding failed with status:', response.status);
                } else {
                    console.log('Successfully forwarded submission to Google Sheets.');
                }
            })
            .catch(err => {
                console.error('Error forwarding to Google Sheets:', err);
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Submission successfully received and stored.'
        });
    } catch (err) {
        console.error('Error writing submission:', err);
        return res.status(500).json({
            success: false,
            error: 'Failed to save submission on server.'
        });
    }
});

// GET Endpoint to retrieve all submissions
app.get('/api/submissions', async (req, res) => {
    try {
        const submissions = await getSubmissions();
        res.status(200).json(submissions);
    } catch (err) {
        console.error('Error fetching submissions:', err);
        res.status(500).json({ success: false, error: 'Failed to fetch submissions.' });
    }
});

// PUT Endpoint to update a submission (status, notes)
app.put('/api/submissions/:id', async (req, res) => {
    const { id } = req.params;
    const { status, notes } = req.body;

    try {
        const updated = await updateSubmission(id, { status, notes });

        if (!updated) {
            return res.status(404).json({
                success: false,
                error: 'Submission not found.'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Submission updated successfully.'
        });
    } catch (err) {
        console.error('Error updating submission:', err);
        return res.status(500).json({
            success: false,
            error: 'Submission update failed on database.'
        });
    }
});

// DELETE Endpoint to remove a submission
app.delete('/api/submissions/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const deleted = await deleteSubmission(id);
        if (!deleted) {
            return res.status(404).json({
                success: false,
                error: 'Submission not found.'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Submission deleted successfully.'
        });
    } catch (err) {
        console.error('Error deleting submission:', err);
        return res.status(500).json({
            success: false,
            error: 'Submission deletion failed.'
        });
    }
});

// ==================== BOOKINGS API ENDPOINTS ====================

app.get('/api/bookings', async (req, res) => {
    try {
        const bookings = await getBookings();
        res.status(200).json(bookings);
    } catch (err) {
        console.error('Error fetching bookings:', err);
        res.status(500).json({ success: false, error: 'Failed to fetch bookings.' });
    }
});

app.post('/api/bookings', async (req, res) => {
    const { name, phone, date, time, service, notes, status } = req.body;
    
    if (!name || !date || !time) {
        return res.status(400).json({ success: false, error: 'Name, date, and time are required.' });
    }

    try {
        const newBooking = {
            id: 'b_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 5),
            name,
            phone: phone || '',
            date,
            time,
            service: service || 'Monthly Maintenance',
            stylist: req.body.stylist || '',
            notes: notes || '',
            status: status || 'Pending',
            duration: req.body.duration || '30 mins',
            price: Number(req.body.price || 0),
            timestamp: new Date().toISOString()
        };

        await saveBooking(newBooking);
        res.status(200).json({ success: true, booking: newBooking });
    } catch (err) {
        console.error('Error creating booking:', err);
        res.status(500).json({ success: false, error: 'Failed to create booking.' });
    }
});

app.put('/api/bookings/:id', async (req, res) => {
    const { id } = req.params;
    
    try {
        const updated = await updateBooking(id, req.body);

        if (!updated) {
            return res.status(404).json({ success: false, error: 'Booking not found.' });
        }
        
        res.status(200).json({ success: true, booking: updated });
    } catch (err) {
        console.error('Error updating booking:', err);
        res.status(500).json({ success: false, error: 'Failed to update booking.' });
    }
});

app.delete('/api/bookings/:id', async (req, res) => {
    const { id } = req.params;
    
    try {
        const deleted = await deleteBooking(id);
        if (!deleted) {
            return res.status(404).json({ success: false, error: 'Booking not found.' });
        }
        res.status(200).json({ success: true, message: 'Booking deleted.' });
    } catch (err) {
        console.error('Error deleting booking:', err);
        res.status(500).json({ success: false, error: 'Failed to delete booking.' });
    }
});

// ==================== SERVICES API ENDPOINTS ====================

app.get('/api/services', async (req, res) => {
    try {
        const services = await getServices();
        res.status(200).json(services);
    } catch (err) {
        console.error('Error fetching services:', err);
        res.status(500).json({ success: false, error: 'Failed to fetch services.' });
    }
});

app.post('/api/services', async (req, res) => {
    const { name, price, duration, description } = req.body;
    
    if (!name || !price) {
        return res.status(400).json({ success: false, error: 'Name and price are required.' });
    }
    
    try {
        const newService = {
            id: 's_' + Date.now().toString(36),
            name,
            price: Number(price),
            duration: duration || '30 mins',
            description: description || ''
        };
        
        await saveService(newService);
        res.status(200).json({ success: true, service: newService });
    } catch (err) {
        console.error('Error creating service:', err);
        res.status(500).json({ success: false, error: 'Failed to create service.' });
    }
});

app.put('/api/services/:id', async (req, res) => {
    const { id } = req.params;
    
    try {
        const updated = await updateService(id, req.body);

        if (!updated) {
            return res.status(404).json({ success: false, error: 'Service not found.' });
        }
        
        res.status(200).json({ success: true, service: updated });
    } catch (err) {
        console.error('Error updating service:', err);
        res.status(500).json({ success: false, error: 'Failed to update service.' });
    }
});

app.delete('/api/services/:id', async (req, res) => {
    const { id } = req.params;
    
    try {
        const deleted = await deleteService(id);
        if (!deleted) {
            return res.status(404).json({ success: false, error: 'Service not found.' });
        }
        res.status(200).json({ success: true, message: 'Service deleted.' });
    } catch (err) {
        console.error('Error deleting service:', err);
        res.status(500).json({ success: false, error: 'Failed to delete service.' });
    }
});

// ==================== PAYMENTS API ENDPOINTS ====================

app.get('/api/payments', async (req, res) => {
    try {
        const payments = await getPayments();
        res.status(200).json(payments);
    } catch (err) {
        console.error('Error fetching payments:', err);
        res.status(500).json({ success: false, error: 'Failed to fetch payments.' });
    }
});

app.post('/api/payments', async (req, res) => {
    const { customer, service, amount, method, status } = req.body;
    
    if (!customer || !amount) {
        return res.status(400).json({ success: false, error: 'Customer name and amount are required.' });
    }
    
    try {
        const newPayment = {
            id: 'p_' + Date.now().toString(36),
            customer,
            service,
            amount: Number(amount),
            method: method || 'Cash',
            status: status || 'Paid',
            timestamp: new Date().toISOString()
        };
        
        await savePayment(newPayment);
        res.status(200).json({ success: true, payment: newPayment });
    } catch (err) {
        console.error('Error creating payment:', err);
        res.status(500).json({ success: false, error: 'Failed to create payment.' });
    }
});

app.put('/api/payments/:id', async (req, res) => {
    const { id } = req.params;
    
    try {
        const updated = await updatePayment(id, req.body);

        if (!updated) {
            return res.status(404).json({ success: false, error: 'Payment not found.' });
        }
        
        res.status(200).json({ success: true, payment: updated });
    } catch (err) {
        console.error('Error updating payment:', err);
        res.status(500).json({ success: false, error: 'Failed to update payment.' });
    }
});

app.delete('/api/payments/:id', async (req, res) => {
    const { id } = req.params;
    
    try {
        const deleted = await deletePayment(id);
        if (!deleted) {
            return res.status(404).json({ success: false, error: 'Payment not found.' });
        }
        res.status(200).json({ success: true, message: 'Payment deleted.' });
    } catch (err) {
        console.error('Error deleting payment:', err);
        res.status(500).json({ success: false, error: 'Failed to delete payment.' });
    }
});

// ==================== SETTINGS API ENDPOINTS ====================

app.get('/api/settings', async (req, res) => {
    try {
        const settings = await getSettings();
        res.status(200).json(settings);
    } catch (err) {
        console.error('Error reading settings:', err);
        res.status(500).json({ success: false, error: 'Failed to read settings.' });
    }
});

app.post('/api/settings', async (req, res) => {
    try {
        const settings = await updateSettings(req.body);
        res.status(200).json({ success: true, settings });
    } catch (err) {
        console.error('Error writing settings:', err);
        res.status(500).json({ success: false, error: 'Failed to save settings.' });
    }
});

// ==================== ADMIN & SALON PARTNER AUTH ENDPOINTS ====================

app.post('/api/admin/login', (req, res) => {
    res.status(200).json({ success: true, role: 'admin', message: 'Admin login successful.' });
});

app.post('/api/partner/login', (req, res) => {
    const { username, partnerName } = req.body;
    const resolvedName = partnerName || username || 'Sarah Jenkins';
    res.status(200).json({ success: true, role: 'partner', name: resolvedName, message: 'Partner login successful.' });
});

// Get bookings assigned to a specific partner/stylist
app.get('/api/partner/bookings', async (req, res) => {
    const stylistName = req.query.stylist;
    if (!stylistName) {
        return res.status(400).json({ success: false, error: 'Stylist name is required.' });
    }
    try {
        const allBookings = await getBookings();
        const partnerBookings = allBookings.filter(b => b.stylist === stylistName);
        res.status(200).json(partnerBookings);
    } catch (err) {
        console.error('Error fetching partner bookings:', err);
        res.status(500).json({ success: false, error: 'Failed to fetch bookings.' });
    }
});

// Partner can only update booking status
app.patch('/api/partner/bookings/:id/status', async (req, res) => {
    const { id } = req.params;
    const { status, stylist } = req.body;

    const validStatuses = ['Pending', 'Confirmed', 'Completed', 'Cancelled'];
    if (!status || !validStatuses.includes(status)) {
        return res.status(400).json({ success: false, error: 'Invalid status value.' });
    }

    try {
        // Verify the booking belongs to this stylist
        const allBookings = await getBookings();
        const booking = allBookings.find(b => b.id === id);
        if (!booking) {
            return res.status(404).json({ success: false, error: 'Booking not found.' });
        }
        if (stylist && booking.stylist !== stylist) {
            return res.status(403).json({ success: false, error: 'You can only update your own appointments.' });
        }

        const updated = await updateBooking(id, { status });
        if (!updated) {
            return res.status(404).json({ success: false, error: 'Booking not found.' });
        }
        
        // Auto-create payment if status changes to Completed
        if (status === 'Completed' && booking.status !== 'Completed') {
            const newPayment = {
                id: 'p_' + Date.now().toString(36),
                customer: booking.name,
                service: booking.service,
                amount: Number(booking.price || 0),
                method: 'Cash', // Default for partner completion
                status: 'Paid',
                timestamp: new Date().toISOString()
            };
            await savePayment(newPayment);
        }
        
        res.status(200).json({ success: true, booking: updated });
    } catch (err) {
        console.error('Error updating booking status:', err);
        res.status(500).json({ success: false, error: 'Failed to update status.' });
    }
});

// Partner Settings Endpoints
app.get('/api/partner/settings', async (req, res) => {
    const stylistName = req.query.stylist;
    if (!stylistName) return res.status(400).json({ success: false, error: 'Stylist name required' });
    try {
        const config = await getPartnerConfig(stylistName);
        res.status(200).json(config);
    } catch (err) {
        console.error('Error fetching partner settings:', err);
        res.status(500).json({ success: false, error: 'Failed to fetch settings' });
    }
});

app.post('/api/partner/settings', async (req, res) => {
    const { stylist, salonShare, services } = req.body;
    if (!stylist) return res.status(400).json({ success: false, error: 'Stylist name required' });
    try {
        const updateData = {};
        if (salonShare !== undefined) updateData.salonShare = Number(salonShare);
        if (services !== undefined) updateData.services = services;
        const updated = await updatePartnerConfig(stylist, updateData);
        res.status(200).json({ success: true, settings: updated });
    } catch (err) {
        console.error('Error saving partner settings:', err);
        res.status(500).json({ success: false, error: 'Failed to save settings' });
    }
});

// ==================== FIREBASE AUTH ENDPOINTS ====================

app.get('/api/auth/config', (req, res) => {
    res.status(200).json({
        projectId: process.env.FIREBASE_PROJECT_ID,
        appId: process.env.FIREBASE_APP_ID,
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
        apiKey: process.env.FIREBASE_API_KEY,
        authDomain: process.env.FIREBASE_AUTH_DOMAIN,
        messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID
    });
});

app.post('/api/auth/register', async (req, res) => {
    const { uid, email, role, partnerName } = req.body;

    if (!uid || !email || !role) {
        return res.status(400).json({ success: false, error: 'uid, email, and role are required.' });
    }

    try {
        const existingUser = await findUserByUid(uid);
        if (existingUser) {
            return res.status(400).json({ success: false, error: 'User is already registered.' });
        }

        const newUser = {
            uid,
            email,
            role,
            partnerName: role === 'partner' ? partnerName : '',
            timestamp: new Date().toISOString()
        };

        await saveUser(newUser);
        res.status(200).json({ success: true, user: newUser });
    } catch (err) {
        console.error('Error registering user:', err);
        res.status(500).json({ success: false, error: 'Failed to register user.' });
    }
});

app.post('/api/auth/session', async (req, res) => {
    const { uid } = req.body;

    if (!uid) {
        return res.status(400).json({ success: false, error: 'uid is required.' });
    }

    try {
        const user = await findUserByUid(uid);
        if (!user) {
            return res.status(404).json({ success: false, error: 'User not registered in local database.' });
        }
        res.status(200).json({ success: true, role: user.role, name: user.partnerName || '' });
    } catch (err) {
        console.error('Error finding user session:', err);
        res.status(500).json({ success: false, error: 'Failed to check session.' });
    }
});

async function getAllPartnerConfigs() {
    if (isMongoConnected()) {
        try {
            return await PartnerConfig.find({});
        } catch (err) {
            console.error('MongoDB read all partner configs error:', err);
        }
    }
    return await readJsonFile('partnerConfig.json', []);
}

app.get('/api/stylists', async (req, res) => {
    try {
        const configs = await getAllPartnerConfigs();
        const stylists = configs.map(c => c.stylist);
        res.status(200).json(stylists);
    } catch (err) {
        console.error('Error fetching stylists:', err);
        res.status(500).json({ success: false, error: 'Failed to fetch stylists.' });
    }
});

// Serve admin dashboard explicitly
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});

// Serve salon partner portal explicitly
app.get('/partner', (req, res) => {
    res.sendFile(path.join(__dirname, 'partner.html'));
});

// Fallback to index.html for frontend routing
app.get('/*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});
